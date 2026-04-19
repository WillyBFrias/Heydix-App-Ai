import puter from "@heyputer/puter.js";
import {
    createHostingSlug,
    fetchBlobFromUrl, getHostedUrl,
    getImageExtension,
    HOSTING_CONFIG_KEY,
    imageUrlToPngBlob,
    isHostedUrl
} from "./utils";


export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {
    const existing = (await  puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;

    if(existing?.subdomain) return  { subdomain: existing.subdomain };

    const subdomain = createHostingSlug();
    
    try {
        const created = await  puter.hosting.create(subdomain, '.');

        const record  = { subdomain: created.subdomain };

        await puter.kv.set(HOSTING_CONFIG_KEY, record);

        return record;
    } catch (e) {
        console.warn(`Could not find subdomain: ${e}`);
        return null;
    }
}

export const uploadImageToHosting = async ({ hosting, url, projectId, label } :
    StoreHostedImageParams): Promise<HostedAsset | null> => {
        if(!hosting || !url) return null;
        if(isHostedUrl(url)) return { url };
        
        try {
            const pngBlob = label === "rendered" ? await imageUrlToPngBlob(url) : null;
            const resolved = pngBlob
                ? { blob: pngBlob, contentType: "image/png" }
                : await fetchBlobFromUrl(url);

            if(!resolved) return null;

            const contentType = resolved.contentType || resolved.blob.type || '';
            const ext = getImageExtension(contentType, url);
            const dir = `projects/${projectId}`;
            const filePath = `${dir}/${label}.${ext}`;

            const uploadFile = new File([resolved.blob], `${label}.${ext}`, {
                type: contentType,
            });

            try {
                await puter.fs.mkdir(dir, { createMissingParents: true });
            } catch (mkdirError) {
                const message = mkdirError instanceof Error ? mkdirError.message : String(mkdirError);
                // Ignore only "already exists"-style failures
                if (!/already exists|EEXIST/i.test(message)) {
                    throw mkdirError;
                }
            }
            await puter.fs.write(filePath, uploadFile);

            const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);

            return hostedUrl ? { url: hostedUrl } : null;
        } catch (e) {
            console.warn(`Failed to stored hosted image: ${e}`);
            return null;
        }
}
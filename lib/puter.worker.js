const PROJECT_PREFIX = 'Heydix_project_';

const jsonError = (status, message, extra = {}) => {
   return new Response(JSON.stringify({ error: message, ...extra }), {
       status,
       headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*'
       }
   })
}

const getUserId = async (userPuter) => {
    try {
        const user = await  userPuter.auth.getUser();

        return  user?.uuid || null;
    } catch {
        return null;
    }
}

router.post('/api/projects/save', async ({ request, user }) => {
    try {
        const userPuter = user.puter;

        if(!userPuter) return jsonError(401, 'Authentication failed');

        const body = await request.json();
        const project = body?.project;
        const visibility = body?.visibility ?? 'private';

        if(!project?.id || !project?.sourceImage) return jsonError(400, 'Project data missing');

        const payload = {
            ...project,
            id: project.id,
            timestamp: project.timestamp || Date.now(),
            updatedAt: new Date().toISOString(),
            isPublic: visibility === 'public',
        }

        const userId = await  getUserId(userPuter);
        if(!userId) return jsonError(401, 'Authentication failed');

        console.log(`Saving project ${project.id} for user ${userId}`);
        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload);

        return new Response(JSON.stringify({ saved: true, id: project.id, project: payload }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (e) {
        return jsonError(500, 'Failed to save project', { message: e.message || 'Unknown error' });
    }
})

router.get('/api/projects/list', async ({ user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const items = (await userPuter.kv.list(PROJECT_PREFIX, true))
            .map(({value}) => value)

        console.log(`Listing ${items.length} projects for user`);

        return new Response(JSON.stringify({ projects: items || [] }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (e) {
        return jsonError(500, 'Failed to list projects', { message: e.message || 'Unknown error' });
    }
})

router.get('/api/projects/get', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id || id === "undefined") return jsonError(400, 'Project ID is required');

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        if (!project) return jsonError(404, 'Project not found');

        return new Response(JSON.stringify({ project }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (e) {
        return jsonError(500, 'Failed to fetch project', { message: e.message || 'Unknown error' });
    }
})


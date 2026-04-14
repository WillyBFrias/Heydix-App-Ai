import puter from "@heyputer/puter.js";

export const signIn = async  () => await  puter.auth.signIn();

export const signOut = async  () =>  puter.auth.signOut();

export const getCorrectUser = async  () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }
}
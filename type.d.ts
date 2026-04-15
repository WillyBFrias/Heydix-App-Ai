interface AuthState {
    isSignedIn: boolean;
    userName: string | null,
    userId: string | null,
    signIn: () => Promise<boolean>;
    signOut: () => Promise<boolean>;
}

type AuthContext = {
    isSignedIn: boolean;
    userName: string | null,
    userId: string | null,
    refreshAuth: () => Promise<boolean>;
    signIn: () => Promise<boolean>;
    signOut: () => Promise<boolean>;
}
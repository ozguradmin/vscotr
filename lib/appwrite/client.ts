// Re-export Firebase compatibility layer as Appwrite-compatible API
// This allows existing code to work with minimal changes

export {
    databases,
    storage,
    ID,
    Query,
    APPWRITE_CONFIG
} from '../firebase/compat';

// Re-export auth as account for compatibility
import { auth } from '../firebase/client';

// Wrap Firebase auth to provide Appwrite-like account API
export const account = {
    get: async () => {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        return {
            $id: user.uid,
            email: user.email,
            name: user.displayName,
            emailVerification: user.emailVerified
        };
    },

    create: async (userId: string, email: string, password: string, name?: string) => {
        // This should be handled by Firebase Auth directly in the registration page
        throw new Error('Use Firebase Auth createUserWithEmailAndPassword');
    },

    createEmailPasswordSession: async (email: string, password: string) => {
        // This should be handled by Firebase Auth directly in the login page
        throw new Error('Use Firebase Auth signInWithEmailAndPassword');
    },

    deleteSession: async (sessionId: string) => {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
    },

    updatePassword: async (newPassword: string, oldPassword: string) => {
        const { updatePassword, EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error('Not authenticated');

        // Re-authenticate before password change
        const credential = EmailAuthProvider.credential(user.email, oldPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    }
};

export default {};

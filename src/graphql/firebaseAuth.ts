import {signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail, User, updateEmail, deleteUser} from "firebase/auth"
import {auth} from "@/lib/firebase"

export const googleProvider = new GoogleAuthProvider()

export async function register(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
}


export const getFirebaseToken = async (): Promise<string | null> => {
    // const user = getAuth().currentUser;
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
};

export async function login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
}

export async function logout(): Promise<void> {
    await signOut(auth)
}

export async function signInWithGoogle(): Promise<User> {
    const userCredential = await signInWithPopup(auth, googleProvider)
    return userCredential.user
}   

export async function sendVerificationEmail(user?: User): Promise<void> {
    const targetUser = user || auth.currentUser;
    if (targetUser) {
        await sendEmailVerification(targetUser);
    } else {
        throw new Error("No user is available to send a verification email.");
    }
}

export async function deleteFirebaseUser(): Promise<void> {
    if (auth.currentUser) await deleteUser(auth.currentUser);
}

export async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email)
}

export const updateFirebaseEmail = async (user: User, newEmail: string): Promise<void> => {
    await updateEmail(user, newEmail);
};
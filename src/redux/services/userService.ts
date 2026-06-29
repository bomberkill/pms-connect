
import { apolloClient } from "@/graphql/apolloClient";
import { CreateUserInput, UpdateUserInput } from "@/types/User";
import { buildCreateUserMutation, buildFollowMutation, buildGetMeQuery, buildGetUserByUidQuery, buildRemoveConnectionMutation, buildUnfollowMutation, buildUpdateMyEmailMutation, buildUpdateMyProfileMutation, buildUnregisterFcmTokenMutation } from "@/graphql/queries/index";
import { clearAuth } from "../slices/authSlice";
// import { clearUser } from "../slices/userSlice";
import { AppDispatch } from "../store";
import { FirebaseError } from "firebase/app";


import { createAsyncThunk } from "@reduxjs/toolkit";
import { deleteFirebaseUser, login, logout as firebaseLogout, register, sendVerificationEmail, updateFirebaseEmail } from "@/graphql/firebaseAuth";
/**
 * Un thunk asynchrone pour créer un utilisateur.
 * Il gère automatiquement les actions pending/fulfilled/rejected.
 * En cas de succès, il retourne les données de l'utilisateur.
 * En cas d'échec, il utilise `rejectWithValue` pour passer un message d'erreur clair.
 */
export const createUser = createAsyncThunk(
    'user/create', // Nom de l'action pour le Redux DevTools
    async (createUserInput: CreateUserInput, { rejectWithValue }) => {
        try {
            const { data, errors } = await apolloClient.mutate({
                mutation: buildCreateUserMutation(),
                variables: { createUserInput: createUserInput }
            });
            if (errors && errors.length > 0) {
                // Si l'API GraphQL retourne une erreur, on la rejette
                return rejectWithValue(errors[0].message);
            }
            console.log("createUser data", data.createUser);
            return data.createUser; // Ceci sera le payload de l'action `fulfilled`
        } catch (error: unknown) {
            // Pour les erreurs réseau ou autres exceptions
            console.error("Create user error:", error);
            return rejectWithValue('errors.unknown');
        }
    }
);

/**
 * Thunk to update the email of an unverified user.
 */
export const updateUnverifiedEmail = createAsyncThunk(
    'user/updateUnverifiedEmail',
    async ({ oldEmail, newEmail, password }: { oldEmail: string, newEmail: string, password: string }, { rejectWithValue }) => {
        try {
            // 1. Re-authenticate to prove ownership. `login` returns the Firebase User object directly.
            const firebaseUser = await login(oldEmail, password);

            // 2. Update email in Firebase Auth
            await updateFirebaseEmail(firebaseUser, newEmail);

            // 3. Send new verification email
            await sendVerificationEmail(firebaseUser);

            // 4. Update email in our backend DB
            const { data, errors } = await apolloClient.mutate({
                mutation: buildUpdateMyEmailMutation(),
                variables: { newEmail },
            });

            if (errors) {
                throw new Error(errors[0].message);
            }

            return data.updateMyEmail;

        } catch (error: unknown) {
            return rejectWithValue(error);
        }
    }
);

/**
 * Thunk to register a user in Firebase and send a verification email.
 * This separates Firebase account creation from profile creation in our DB.
 */
export const registerAndSendVerification = createAsyncThunk(
    'user/registerAndSendVerification',
    async ({ email, password }: { email: string, password?: string }, { rejectWithValue }) => {
        if (!password) {
            // This case is for Google Sign-In, where the user is already created.
            // We just need to ensure the email is sent if they are new.
            // The logic in the component will handle existing Google users.
            return;
        }
        try {
            const firebaseUser = await register(email, password);
            await sendVerificationEmail(firebaseUser);
            return firebaseUser.uid;
        } catch (error: unknown) {
            if (error instanceof FirebaseError) {
                return rejectWithValue(error.code);
            }
            return rejectWithValue('errors.unknown');
        }
    }
);

/**
 * Thunk to delete the current Firebase user.
 * Useful for cleaning up if the user backs out of email verification.
 */
export const deleteCurrentUser = createAsyncThunk(
    'user/deleteCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            await deleteFirebaseUser();
        } catch (error: unknown) {
            if (error instanceof FirebaseError) {
                return rejectWithValue(error.code);
            }
            return rejectWithValue('errors.unknown');
        }
    }
);

/**
 * Thunk to follow a user.
 * On success, it returns the ID of the user that was followed.
 */
export const followUser = createAsyncThunk(
    'user/follow',
    async (userIdToFollow: string, { dispatch, rejectWithValue }) => {
        try {
            const { data, errors } = await apolloClient.mutate({
                mutation: buildFollowMutation(),
                variables: { userId: userIdToFollow }
            });

            if (errors || !data.follow) {
                return rejectWithValue(errors ? errors[0].message : 'Failed to follow user.');
            }
            dispatch(fetchMe());

            // Return the ID to be used in the reducer for an optimistic update
            // return userIdToFollow;
        } catch (error: unknown) {
            console.error("Follow user error:", error);
            return rejectWithValue('errors.unknown');
        }
    }
);

/**
 * Thunk to unfollow a user.
 * On success, it returns the ID of the user that was unfollowed.
 */
export const unfollowUser = createAsyncThunk(
    'user/unfollow',
    async (userIdToUnfollow: string, { dispatch, rejectWithValue }) => {
        try {
            const { data, errors } = await apolloClient.mutate({
                mutation: buildUnfollowMutation(),
                variables: { userId: userIdToUnfollow }
            });

            if (errors || !data.unfollow) {
                return rejectWithValue(errors ? errors[0].message : 'Failed to unfollow user.');
            }
            dispatch(fetchMe());
            // return userIdToUnfollow;
        } catch (error: unknown) {
            console.error("Unfollow user error:", error);
            return rejectWithValue('errors.unknown');
        }
    }
);

/**
 * Thunk to remove an existing connection.
 */
export const removeConnection = createAsyncThunk(
    'user/removeConnection', // Note the prefix 'user/' now
    async (userIdToRemove: string, { dispatch, rejectWithValue }) => {
        try {
            const { data, errors } = await apolloClient.mutate({
                mutation: buildRemoveConnectionMutation(),
                variables: { userIdB: userIdToRemove }
            });
            if (errors || !data.removeConnection) {
                return rejectWithValue(errors ? errors[0].message : 'Failed to remove connection.');
            }
            // if (!data.removeConnection) {
            //     return rejectWithValue("removeConnection is null or false")
            // }
            // if (data.removeConnection) {
            // }
            dispatch(fetchMe());
        } catch (error: unknown) {
            console.error("Remove connection error:", error);
            return rejectWithValue('errors.unknown');
        }
    }
);

/**
 * Un thunk asynchrone pour déconnecter l'utilisateur.
 * Il gère la déconnexion de Firebase et nettoie les états Redux.
 */
export const logoutUser = createAsyncThunk<void, void, { dispatch: AppDispatch }>(
    'user/logout',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            // 1. Unregister FCM Token if exists (Client-side only)
            if (typeof window !== "undefined") {
                try {
                    const { getMessaging, getToken, deleteToken } = await import("firebase/messaging");
                    const { default: firebaseApp } = await import("@/lib/firebase");
                    const messaging = getMessaging(firebaseApp);

                    const token = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                    });

                    if (token) {
                        // Unregister from Backend
                        await apolloClient.mutate({
                            mutation: buildUnregisterFcmTokenMutation(),
                            variables: { token }
                        }).catch(err => console.error("Failed to unregister FCM token from backend:", err));

                        // Optional: Delete from Firebase instance too? 
                        // Usually good practice if we want to ensure no more messages come
                        // AND to force a fresh token on next login if needed.
                        await deleteToken(messaging);
                    }
                } catch (fcmError) {
                    console.warn("FCM Cleanup failed:", fcmError);
                    // Don't block logout
                }
            }

            // 2. Logout from Firebase
            await firebaseLogout();

            // 3. Clean Redux
            dispatch(clearAuth());
            return;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Failed to logout.');
        }
    }
);

/**

 * Un thunk asynchrone pour connecter un utilisateur et récupérer son profil.
 */
export const loginAndFetchUser = createAsyncThunk(
    'user/loginAndFetch',
    async ({ email, password }: { email: string, password: string }, { dispatch, rejectWithValue }) => {
        try {
            // Étape 1: Connexion à Firebase
            const firebaseUser = await login(email, password);
            // NOUVELLE VÉRIFICATION : L'e-mail doit être vérifié
            if (!firebaseUser.emailVerified && firebaseUser.email) {
                return rejectWithValue('auth/email-not-verified');
            }
            // return firebaseUser;
            // Étape 2: Récupération du profil depuis notre API avec l'UID
            const { data, errors } = await apolloClient.query({
                query: buildGetUserByUidQuery(),
                variables: { firebaseUid: firebaseUser.uid },
                fetchPolicy: 'network-only' // Toujours récupérer les données fraîches
            });

            if (errors && errors.length > 0) {
                return rejectWithValue(errors[0].message);
            }
            // console.log("loginAndFetchUser data", data);
            if (!data.getUserByFirebaseUid) {
                return rejectWithValue('errors.user.profileNotFound');
            }

            if (data.getUserByFirebaseUid.accountStatus === 'PENDING_VERIFICATION') {
                await firebaseLogout();
                dispatch(clearAuth());
                return rejectWithValue('auth/account-pending-approval');
            }

            // Étape 3: Retourner le profil utilisateur
            // Cela sera le payload de l'action `fulfilled`
            return data.getUserByFirebaseUid;

        } catch (error: unknown) {
            if (error instanceof FirebaseError) {
                return rejectWithValue(error.code);
            }
            // Gère les erreurs non-Firebase (ex: réseau, API GraphQL)
            console.error("Unhandled login error:", error);
            return rejectWithValue('errors.unknown');
        }
    }
);
/**
 * Un thunk asynchrone pour récupérer un profil utilisateur par son UID.
 * Idéal pour être utilisé au chargement de l'app lorsque Firebase détecte une session.
 */
export const fetchUserByUid = createAsyncThunk(
    'user/fetchByUid',
    async (uid: string, { rejectWithValue }) => {
        try {
            const { data, errors } = await apolloClient.query({
                query: buildGetUserByUidQuery(),
                variables: { firebaseUid: uid },
                fetchPolicy: 'network-only'
            });

            if (errors && errors.length > 0) {
                return rejectWithValue(errors[0].message);
            }
            if (!data.getUserByFirebaseUid) {
                return rejectWithValue("getUserByFirebaseUid is null")
            }
            // console.log("fetchUserByUid data", data);
            return data.getUserByFirebaseUid;
        } catch (error: unknown) {
            console.error("Failed to fetch user profile by UID:", error);
            return rejectWithValue('errors.user.fetchProfileFailed');
        }
    }
);
export const fetchMe = createAsyncThunk(
    'user/fetchMe',
    async (_, { rejectWithValue }) => {
        try {
            const { data, errors } = await apolloClient.query({
                query: buildGetMeQuery(),
                // variables: {},
                fetchPolicy: 'network-only'
            });

            if (errors && errors.length > 0) {
                return rejectWithValue(errors[0].message);
            }
            if (!data.me) {
                return rejectWithValue("getMe is null")
            }
            // console.log("fetchMe data", data);
            return data.me;
        } catch (error: unknown) {
            console.error("Failed to fetch user profile:", error);
            return rejectWithValue('errors.user.fetchProfileFailed');
        }
    }
);

/**
 * 
 * 
 */
export const updateUser = createAsyncThunk(
    'user/update',
    async (updateUserInput: UpdateUserInput, { rejectWithValue }) => {
        try {
            const { data, errors } = await apolloClient.mutate({
                mutation: buildUpdateMyProfileMutation(),
                variables: { updateUserInput: updateUserInput }
            });
            if (errors && errors.length > 0) {
                // Si l'API GraphQL retourne une erreur, on la rejette
                return rejectWithValue(errors[0].message);
            }
            console.log("updateUser data", data.updateMyProfile);
            return data.updateMyProfile; // Ceci sera le payload de l'action `fulfilled`
        } catch (error: unknown) {
            // Pour les erreurs réseau ou autres exceptions
            console.error("Update user error:", error);
            return rejectWithValue('errors.unknown');
        }
    }
);

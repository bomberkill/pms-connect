
import { apolloClient } from "@/graphql/apolloClient";
import { UpdateUserInput } from "@/types/User";
import { buildFollowMutation, buildGetMeQuery, buildGetUserByAuthUserIdQuery, buildRemoveConnectionMutation, buildUnfollowMutation, buildUpdateMyEmailMutation, buildUpdateMyProfileMutation, buildUnregisterFcmTokenMutation } from "@/graphql/queries/index";
import { clearAuth } from "../slices/authSlice";
// import { clearUser } from "../slices/userSlice";
import { AppDispatch } from "../store";

import { createAsyncThunk } from "@reduxjs/toolkit";
import { login, logout as authLogout, sendVerificationEmail, updateAuthEmail, AuthApiError } from "@/graphql/betterAuth";
/**
 * Thunk to update the email of an unverified user.
 */
export const updateUnverifiedEmail = createAsyncThunk(
    'user/updateUnverifiedEmail',
    async ({ oldEmail, newEmail, password }: { oldEmail: string, newEmail: string, password: string }, { rejectWithValue }) => {
        try {
            // 1. Re-authenticate to prove ownership (establishes the session Better Auth needs below).
            await login(oldEmail, password);

            // 2. Update email via Better Auth
            await updateAuthEmail(newEmail);

            // 3. Send new verification email
            await sendVerificationEmail(newEmail);

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

            // 2. Logout from Better Auth
            await authLogout();

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
            // Étape 1: Connexion via Better Auth
            const authUser = await login(email, password);
            // NOUVELLE VÉRIFICATION : L'e-mail doit être vérifié
            if (!authUser.emailVerified && authUser.email) {
                return rejectWithValue('EMAIL_NOT_VERIFIED');
            }
            // Étape 2: Récupération du profil depuis notre API avec l'identifiant Better Auth
            const { data, errors } = await apolloClient.query({
                query: buildGetUserByAuthUserIdQuery(),
                variables: { authUserId: authUser.id },
                fetchPolicy: 'network-only' // Toujours récupérer les données fraîches
            });

            if (errors && errors.length > 0) {
                return rejectWithValue(errors[0].message);
            }
            if (!data.getUserByAuthUserId) {
                return rejectWithValue('errors.user.profileNotFound');
            }

            if (data.getUserByFirebaseUid.accountStatus === 'PENDING_VERIFICATION') {
                await firebaseLogout();
                dispatch(clearAuth());
                return rejectWithValue('auth/account-pending-approval');
            }

            // Étape 3: Retourner le profil utilisateur
            // Cela sera le payload de l'action `fulfilled`
            return data.getUserByAuthUserId;

        } catch (error: unknown) {
            if (error instanceof AuthApiError) {
                return rejectWithValue(error.code);
            }
            // Gère les erreurs inattendues (ex: réseau, API GraphQL)
            console.error("Unhandled login error:", error);
            return rejectWithValue('errors.unknown');
        }
    }
);
/**
 * Un thunk asynchrone pour récupérer un profil utilisateur par son identifiant Better Auth.
 * Idéal pour être utilisé au chargement de l'app lorsqu'une session est détectée.
 */
export const fetchUserByAuthId = createAsyncThunk(
    'user/fetchByAuthId',
    async (authUserId: string, { rejectWithValue }) => {
        try {
            const { data, errors } = await apolloClient.query({
                query: buildGetUserByAuthUserIdQuery(),
                variables: { authUserId },
                fetchPolicy: 'network-only'
            });

            if (errors && errors.length > 0) {
                return rejectWithValue(errors[0].message);
            }
            if (!data.getUserByAuthUserId) {
                return rejectWithValue("getUserByAuthUserId is null")
            }
            return data.getUserByAuthUserId;
        } catch (error: unknown) {
            console.error("Failed to fetch user profile by auth id:", error);
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

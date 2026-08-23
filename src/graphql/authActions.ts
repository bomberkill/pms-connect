import { apolloClient } from "@/graphql/apolloClient";
import { UpdateUserInput, User } from "@/types/User";
import {
    buildGetMeQuery,
    buildGetUserByAuthUserIdQuery,
    buildUpdateMyEmailMutation,
    buildUpdateMyProfileMutation,
    buildUnregisterFcmTokenMutation,
    buildRemoveUserMutation,
} from "@/graphql/queries/index";
import {
    login,
    logout as authLogout,
    sendVerificationEmail,
    updateAuthEmail,
    AuthApiError,
} from "@/graphql/betterAuth";
import { clearAuthTokenCache } from "@/lib/auth-client";

/**
 * Logs in via Better Auth, then loads the matching app profile.
 * Throws AuthApiError with a stable `.code` for every known failure so
 * callers can switch on it instead of comparing raw strings.
 */
export async function loginAndFetchUser(email: string, password: string): Promise<User> {
    const authUser = await login(email, password);

    if (!authUser.emailVerified && authUser.email) {
        throw new AuthApiError("EMAIL_NOT_VERIFIED", "Email not verified");
    }

    const { data, errors } = await apolloClient.query({
        query: buildGetUserByAuthUserIdQuery(),
        variables: { authUserId: authUser.id },
        fetchPolicy: "network-only",
    });

    if (errors && errors.length > 0) {
        throw new AuthApiError("UNKNOWN_ERROR", errors[0].message);
    }
    if (!data.getUserByAuthUserId) {
        throw new AuthApiError("PROFILE_NOT_FOUND", "No app profile for this account");
    }
    if (data.getUserByAuthUserId.accountStatus === "PENDING_VERIFICATION") {
        await authLogout();
        throw new AuthApiError("ACCOUNT_PENDING_APPROVAL", "Account pending approval");
    }

    return data.getUserByAuthUserId;
}

/**
 * Loads the app profile for an already-authenticated Better Auth session.
 * Used after a Google OAuth redirect, where we only get the session back.
 */
export async function fetchUserByAuthId(authUserId: string): Promise<User> {
    const { data, errors } = await apolloClient.query({
        query: buildGetUserByAuthUserIdQuery(),
        variables: { authUserId },
        fetchPolicy: "network-only",
    });

    if (errors && errors.length > 0) {
        throw new AuthApiError("UNKNOWN_ERROR", errors[0].message);
    }
    if (!data.getUserByAuthUserId) {
        throw new AuthApiError("PROFILE_NOT_FOUND", "No app profile for this account");
    }
    return data.getUserByAuthUserId;
}

export async function fetchMe(): Promise<User> {
    const { data, errors } = await apolloClient.query({
        query: buildGetMeQuery(),
        fetchPolicy: "network-only",
    });

    if (errors && errors.length > 0) {
        throw new AuthApiError("UNKNOWN_ERROR", errors[0].message);
    }
    if (!data.me) {
        throw new AuthApiError("PROFILE_NOT_FOUND", "No app profile for this account");
    }
    return data.me;
}

/**
 * Logs out: unregisters the FCM push token (best-effort, never blocks
 * logout), then ends the Better Auth session.
 */
export async function logoutUser(): Promise<void> {
    if (typeof window !== "undefined") {
        try {
            const { getMessaging, getToken, deleteToken } = await import("firebase/messaging");
            const { default: firebaseApp } = await import("@/lib/firebase");
            const messaging = getMessaging(firebaseApp);

            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (token) {
                await apolloClient
                    .mutate({ mutation: buildUnregisterFcmTokenMutation(), variables: { token } })
                    .catch((err) => console.error("Failed to unregister FCM token from backend:", err));
                await deleteToken(messaging);
            }
        } catch (fcmError) {
            console.warn("FCM cleanup failed:", fcmError);
        }
    }

    await authLogout();
    clearAuthTokenCache();
}

export async function updateUser(updateUserInput: UpdateUserInput): Promise<User> {
    const { data, errors } = await apolloClient.mutate({
        mutation: buildUpdateMyProfileMutation(),
        variables: { updateUserInput },
    });

    if (errors && errors.length > 0) {
        throw new AuthApiError("UNKNOWN_ERROR", errors[0].message);
    }
    return data.updateMyProfile;
}

/**
 * Deactivates the current user's own account (soft delete: accountStatus
 * -> DEACTIVATED, no data is erased or anonymized). removeUser itself
 * doesn't touch the Better Auth session, so this always ends with a real
 * logout — otherwise the caller would stay signed in on a "deactivated"
 * account, which would be a real (if minor) security-perception bug.
 */
export async function deactivateAccount(): Promise<void> {
    const { errors } = await apolloClient.mutate({
        mutation: buildRemoveUserMutation(),
    });

    if (errors && errors.length > 0) {
        throw new AuthApiError("UNKNOWN_ERROR", errors[0].message);
    }

    await logoutUser();
}

/**
 * Changes the account email: re-authenticates to prove ownership (this is
 * also the session Better Auth needs for the change itself), updates it via
 * Better Auth, sends a new verification email, then syncs it to our API.
 */
export async function updateUnverifiedEmail({
    oldEmail,
    newEmail,
    password,
}: {
    oldEmail: string;
    newEmail: string;
    password: string;
}): Promise<void> {
    await login(oldEmail, password);
    await updateAuthEmail(newEmail);
    await sendVerificationEmail(newEmail);

    const { errors } = await apolloClient.mutate({
        mutation: buildUpdateMyEmailMutation(),
        variables: { newEmail },
    });

    if (errors && errors.length > 0) {
        throw new AuthApiError("UNKNOWN_ERROR", errors[0].message);
    }
}

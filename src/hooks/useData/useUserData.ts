import { useQuery, useMutation, useSubscription, useLazyQuery } from '@apollo/client';
import {
    buildGetAllUsersQuery,
    buildGetMeQuery,
    buildGetUserByIdQuery,
    buildGetUserBySlugQuery,
    buildGetFollowersQuery,
    buildGetFollowingQuery,
    buildUpdateMyProfileMutation,
    buildUpdateMyEmailMutation,
    buildFollowMutation,
    buildUnfollowMutation,
    buildFollowsUpdatedSubscription,
    buildCheckUserExistsByEmailQuery,
    buildCheckUserExistsByPhoneNumberQuery,
    buildRegisterFcmTokenMutation,
    buildUnregisterFcmTokenMutation,
} from '@/graphql/queries/index';
import { CheckUserExistsResponse, FollowsUpdated, User, UpdateUserInput } from '@/types/User';
// import { useAppSelector, useAppDispatch } from '@/lib/hooks';
// import { setUser } from '@/redux/slices/userSlice';
import { useEffect, useCallback } from 'react';

// =============================================================================
// == USER & SUGGESTIONS
// =============================================================================

interface UseUsersOptions {
    limit?: number;
}

/**
 * Hook to fetch a list of user suggestions.
 */
export const useUsers = (options: UseUsersOptions = {}) => {
    const { limit = 5 } = options;
    //   const { user } = useAppSelector((state) => state.user);

    const { data, loading, error, ...rest } = useQuery(buildGetAllUsersQuery(), {
        variables: { limit },
        fetchPolicy: 'cache-and-network', // ✅ Added
        // skip: !user,
    });

    const suggestions: User[] = data?.getAllUsers || [];

    return { suggestions, loading, error, ...rest };
};

/**
 * Hook to get the current authenticated user's data.
 */
export const useMe = (options?: { skip?: boolean }) => {
    //   const { user } = useAppSelector((state) => state.user);
    //   const dispatch = useAppDispatch();
    const { data, loading, error, refetch } = useQuery<{ me: User }>(buildGetMeQuery(), {
        skip: options?.skip,
        fetchPolicy: 'cache-and-network',
    });

    const me = data?.me ?? null;

    //   useEffect(() => {
    //     if (me && JSON.stringify(me) !== JSON.stringify(user)) {
    //       dispatch(setUser(me));
    //     }
    //   }, [me, user, dispatch]);

    return { me, loading, error, refetch };
};

/**
 * Hook to fetch a user by ID.
 */
export const useUser = (userId: string) => {
    const { data, loading, error, refetch } = useQuery<{ getUserById: User }>(
        buildGetUserByIdQuery(),
        {
            variables: { id: userId },
            skip: !userId,
            fetchPolicy: 'cache-and-network',
        }
    );

    return {
        user: data?.getUserById,
        loading,
        error,
        refetch,
    };
};

/**
 * Hook to fetch a user by slug.
 */
export const useUserBySlug = (slug: string) => {
    const { data, loading, error, refetch } = useQuery<{ getUserBySlug: User }>(
        buildGetUserBySlugQuery(),
        {
            variables: { slug },
            skip: !slug,
            fetchPolicy: 'cache-and-network',
        }
    );

    return {
        user: data?.getUserBySlug,
        loading,
        error,
        refetch,
    };
};

// =============================================================================
// == FOLLOWS
// =============================================================================

/**
 * Hook to fetch user followers.
 */
export const useFollowers = (userId: string) => {
    const { data, loading, error, refetch } = useQuery<{ getFollowers: User[] }>(
        buildGetFollowersQuery(),
        {
            variables: { userId },
            skip: !userId,
            fetchPolicy: 'cache-and-network',
        }
    );

    return {
        followers: data?.getFollowers || [],
        loading,
        error,
        refetch,
    };
};

/**
 * Hook to fetch users that the current user is following.
 */
export const useFollowing = (userId: string) => {
    const { data, loading, error, refetch } = useQuery<{ getFollowing: User[] }>(
        buildGetFollowingQuery(),
        {
            variables: { userId },
            skip: !userId,
            fetchPolicy: 'cache-and-network',
        }
    );

    return {
        following: data?.getFollowing || [],
        loading,
        error,
        refetch,
    };
};

/**
 * Hook that provides follow/unfollow actions.
 */
export const useFollowActions = () => {
    const { me } = useMe();
    const [followUser, { loading: following, error: followError }] = useMutation<{ follow: boolean }, { userId: string }>(buildFollowMutation(), {
        optimisticResponse: { follow: true },
        update(cache, { data }, { variables }) {
            if (data?.follow && variables?.userId) {
                // 1. Update target user's fields
                cache.modify({
                    id: cache.identify({ __typename: 'User', id: variables.userId }),
                    fields: {
                        isFollowing: () => true,
                        followersCount: (count: number = 0) => count + 1,
                    }
                });

                // 2. Update 'me' user's following count
                if (me) {
                    cache.modify({
                        id: cache.identify({ __typename: 'User', id: me.id }),
                        fields: {
                            followingCount: (count: number = 0) => count + 1,
                        }
                    });
                }
            }
        }
    });

    const [unfollowUser, { loading: unfollowing, error: unfollowError }] = useMutation<{ unfollow: boolean }, { userId: string }>(buildUnfollowMutation(), {
        optimisticResponse: { unfollow: true },
        update(cache, { data }, { variables }) {
            if (data?.unfollow && variables?.userId) {
                // 1. Update target user's fields
                cache.modify({
                    id: cache.identify({ __typename: 'User', id: variables.userId }),
                    fields: {
                        isFollowing: () => false,
                        followersCount: (count: number = 0) => Math.max(0, count - 1),
                    }
                });

                // 2. Update 'me' user's following count
                if (me) {
                    cache.modify({
                        id: cache.identify({ __typename: 'User', id: me.id }),
                        fields: {
                            followingCount: (count: number = 0) => Math.max(0, count - 1),
                        }
                    });
                }
            }
        }
    });

    return { followUser, following, followError, unfollowUser, unfollowing, unfollowError };
};

export const useFollowsSubscription = (userId: string) => {
    const { data, loading, error } = useSubscription<{ followsUpdated: FollowsUpdated }>(buildFollowsUpdatedSubscription(), {
        variables: { userId }
    })
    return { followsUpdated: data?.followsUpdated, loading, error }
}


// =============================================================================
// == USER CHECKS
// =============================================================================

/**
 * Hook to check if a user exists by email or phone number.
 * Uses lazy queries to be triggered on demand (e.g., in a form).
 */
export const useCheckUserExists = () => {
    const [checkByEmail, { loading: loadingEmail, error: errorEmail, data: dataEmail }] = useLazyQuery<
        { checkUserExistsByEmail: CheckUserExistsResponse },
        { email: string }
    >(buildCheckUserExistsByEmailQuery());

    const [checkByPhone, { loading: loadingPhone, error: errorPhone, data: dataPhone }] = useLazyQuery<
        { checkUserExistsByPhoneNumber: CheckUserExistsResponse },
        { phoneNumber: string }
    >(buildCheckUserExistsByPhoneNumberQuery());

    return {
        checkByEmail,
        loadingEmail,
        errorEmail,
        emailExistsResult: dataEmail?.checkUserExistsByEmail,
        checkByPhone,
        loadingPhone,
        errorPhone,
        phoneExistsResult: dataPhone?.checkUserExistsByPhoneNumber,
    };
};

// =============================================================================
// == USER MUTATIONS
// =============================================================================

/**
 * Hook for user profile mutations.
 */
export const useUserMutations = () => {
    const [updateProfile, { loading: updating, error: updateError }] = useMutation<
        { updateMyProfile: User },
        { updateUserInput: UpdateUserInput }
    >(buildUpdateMyProfileMutation());

    const [updateEmail, { loading: updatingEmail, error: emailError }] = useMutation<
        { updateMyEmail: User },
        { newEmail: string }
    >(buildUpdateMyEmailMutation());

    return {
        updateProfile,
        updating,
        updateError,
        updateEmail,
        updatingEmail,
        emailError,
    };
};

/**
 * Hook for FCM token management.
 */
export const useFcmToken = () => {
    const { me } = useMe();
    const [registerToken, { loading: registering, error: registerError }] = useMutation<
        { registerFcmToken: boolean },
        { token: string }
    >(buildRegisterFcmTokenMutation());

    const [unregisterToken, { loading: unregistering, error: unregisterError }] = useMutation<
        { unregisterFcmToken: boolean },
        { token: string }
    >(buildUnregisterFcmTokenMutation());

    const LAST_FCM_TOKEN_KEY = "pms_last_fcm_token";

    const syncToken = useCallback(async () => {
        if (typeof window === "undefined") return;

        try {
            const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
            const { default: firebaseApp } = await import("@/lib/firebase");

            const supported = await isSupported();
            if (!supported) return;

            const messaging = getMessaging(firebaseApp);
            const permission = Notification.permission;

            if (permission === 'granted') {
                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

                // Register Service Worker explicitly to avoid 404/MIME issues with localization middleware
                let swRegistration = undefined;
                try {
                    swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                } catch {
                    // console.warn("[useFcmToken] SW registration failed, letting getToken handle it:", err);
                }

                // Add timeout to prevent hangs
                const tokenPromise = getToken(messaging, {
                    vapidKey,
                    serviceWorkerRegistration: swRegistration
                });

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), 10000)
                );

                const currentToken = await Promise.race([tokenPromise, timeoutPromise]) as string | null;

                if (currentToken) {
                    const lastToken = localStorage.getItem(LAST_FCM_TOKEN_KEY);

                    if (currentToken !== lastToken) {
                        console.log("[useFcmToken] Registering new token");
                        await registerToken({ variables: { token: currentToken } });
                        localStorage.setItem(LAST_FCM_TOKEN_KEY, currentToken);
                    } else {
                        // console.log("[useFcmToken] Token already synced");
                    }
                }
            }
        } catch (error) {
            console.warn("[useFcmToken] Sync failed:", error);
        }
    }, [registerToken]);

    // Auto-sync on mount and refresh periodically
    useEffect(() => {
        if (!me) return;

        syncToken();

        // Periodic refresh (e.g., every 24h) to ensure token freshness
        const interval = setInterval(() => {
            syncToken();
        }, 24 * 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [me, syncToken]);

    const requestPermission = async () => {
        if (typeof window === "undefined") return false;
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await syncToken();
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error requesting permission:", error);
            return false;
        }
    };

    // Helper to unregister token on logout
    const handleLogout = async () => {
        const token = localStorage.getItem(LAST_FCM_TOKEN_KEY);
        if (token) {
            try {
                await unregisterToken({ variables: { token } });
                localStorage.removeItem(LAST_FCM_TOKEN_KEY);
            } catch (e) {
                console.warn("Failed to unregister token on logout:", e);
            }
        }
    };

    return {
        registerToken,
        registering,
        registerError,
        unregisterToken,
        unregistering,
        unregisterError,
        requestPermission,
        permissionState: typeof window !== "undefined" ? Notification.permission : 'default',
        handleLogout // Expose this for Logout buttons
    };
};

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
import { useEffect } from 'react';

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
export const useMe = () => {
    //   const { user } = useAppSelector((state) => state.user);
    //   const dispatch = useAppDispatch();
    const { data, loading, error, refetch } = useQuery<{ me: User }>(buildGetMeQuery(), {
        // skip: !user,
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
    const [followUser, { loading: following, error: followError }] = useMutation<{ follow: boolean }, { userId: string }>(buildFollowMutation());

    const [unfollowUser, { loading: unfollowing, error: unfollowError }] = useMutation<{ unfollow: boolean }, { userId: string }>(buildUnfollowMutation());

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
    const { me } = useMe(); // We need to know if user is logged in
    const [registerToken, { loading: registering, error: registerError }] = useMutation<
        { registerFcmToken: boolean },
        { token: string }
    >(buildRegisterFcmTokenMutation());

    const [unregisterToken, { loading: unregistering, error: unregisterError }] = useMutation<
        { unregisterFcmToken: boolean },
        { token: string }
    >(buildUnregisterFcmTokenMutation());

    useEffect(() => {
        if (typeof window === "undefined" || !me) return;

        const syncToken = async () => {
            try {
                const { getMessaging, getToken } = await import("firebase/messaging");
                const { default: firebaseApp } = await import("@/lib/firebase");

                // Check if supported
                const messaging = getMessaging(firebaseApp);

                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const currentToken = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY // Optional if set in firebase config, but good to have
                    });

                    if (currentToken) {
                        // Ideally we check if it changed, but register should be idempotent or cheap
                        await registerToken({ variables: { token: currentToken } });

                        // Store in local storage to avoid re-syncing? 
                        // The user might have logged out and back in. 
                        // API should handle "already exists".
                    }
                }
            } catch (error) {
                console.warn("FCM Token sync failed or not supported:", error);
            }
        };

        syncToken();
    }, [me, registerToken]);

    return {
        registerToken,
        registering,
        registerError,
        unregisterToken,
        unregistering,
        unregisterError,
    };
};
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  buildGetAllUsersQuery,
  buildGetMeQuery,
  buildFollowMutation,
  buildUnfollowMutation,
  buildFollowsUpdatedSubscription,
} from '@/graphql/queries/index';
import { FollowsUpdated, User } from '@/types/User';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setUser } from '@/redux/slices/userSlice';
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
  const { user } = useAppSelector((state) => state.user);

  const { data, loading, error, ...rest } = useQuery(buildGetAllUsersQuery(), {
    variables: { limit },
    skip: !user,
  });

  const suggestions: User[] = data?.getAllUsers || [];

  return { suggestions, loading, error, ...rest };
};

/**
 * Hook to get the current authenticated user's data.
 */
export const useGetMe = () => {
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { data, loading, error, refetch } = useQuery<{ me: User }>(buildGetMeQuery(), {
    skip: !user,
    fetchPolicy: 'cache-and-network',
  });

  const me = data?.me;

  useEffect(() => {
    if (me && JSON.stringify(me) !== JSON.stringify(user)) {
      dispatch(setUser(me));
    }
  }, [me, user, dispatch]);

  return { me, loading, error, refetch };
};

// =============================================================================
// == FOLLOWS
// =============================================================================

/**
 * Hook that provides follow/unfollow actions.
 */
export const useFollowActions = () => {
  const [followUser, { loading: following, error: followError }] = useMutation<{ follow: boolean }, {userId: string}>(buildFollowMutation());

  const [unfollowUser, { loading: unfollowing, error: unfollowError }] = useMutation<{ unfollow: boolean }, {userId: string}>(buildUnfollowMutation());

  return { followUser, following, followError, unfollowUser, unfollowing, unfollowError };
};

export const useFollowsSubscription = (userId: string) => {
  const {data, loading, error} = useSubscription<{followsUpdated: FollowsUpdated}>(buildFollowsUpdatedSubscription(), {
    variables: {userId}
  })
  return {followsUpdated: data?.followsUpdated, loading, error}
}
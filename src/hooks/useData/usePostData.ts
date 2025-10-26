import { useQuery, useMutation } from '@apollo/client';
import {
  buildGetFeedQuery,
  buildGetPostByIdQuery,
  buildCreatePostMutation,
  buildUpdatePostMutation,
  buildRemovePostMutation,
  buildGetNewFeedItemsCountQuery,
} from '@/graphql/queries/index';
import { Post, CreatePostInput, UpdatePostInput } from '@/types/Post';

// =============================================================================
// == FEED & POSTS
// =============================================================================

/**
 * Hook for fetching the main feed.
 */
export const useFeed = (options: { limit?: number } = {}) => {
  const { limit = 10 } = options;

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery<{ getFeed: Post[] }>(
    buildGetFeedQuery(),
    {
      variables: { limit, skip: 0 },
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: true, // utile pour savoir quand un refetch est en cours
    }
  );

  const posts: Post[] = data?.getFeed || [];

  const loadMore = async () => {
    await fetchMore({
      variables: {
        skip: posts.length,
        limit,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previousResult;
        return {
          getFeed: [...previousResult.getFeed, ...fetchMoreResult.getFeed],
        };
      },
    });
  };

  const refresh = async () => {
    await refetch(); // 🔁 Recharge le flux depuis le backend (rafraîchit le cache)
  };

  return {
    posts,
    loading,
    error,
    loadMore,
    refresh,
    isRefetching: networkStatus === 4, // utile pour afficher un loader pendant un refresh
  };
};

/**
 * Hook for fetching a single post by its ID.
 */
export const usePost = (postId: string, isComment?: boolean) => {
  const { data, loading, error } = useQuery<{ getPostById: Post }>(
    buildGetPostByIdQuery(),
    {
      variables: { id: postId },
      skip: !postId || isComment,
    }
  );

  return { post: data?.getPostById, loading, error };
}

/**
 * Hook that provides post mutation actions (create, update, remove).
 */
export const usePostMutations = () => {
  const [createPost, { loading: creating, error: createError }] = useMutation<
    { createPost: Post }, { createPostInput: CreatePostInput }
  >(buildCreatePostMutation(), {
    // refetchQueries: ['GetFeed'],
  });

  const [updatePost, { loading: updating, error: updateError }] = useMutation<
    { updatePost: Post }, { postId: string; updatePostInput: UpdatePostInput }
  >(buildUpdatePostMutation());

  const [removePost, { loading: removing, error: removeError }] = useMutation<
    { removePost: boolean }, { id: string }
  >(buildRemovePostMutation(), {
    // refetchQueries: ['GetFeed'],
  });

  return { createPost, creating, createError, updatePost, updating, updateError, removePost, removing, removeError };
};

/**
 * Hook for fetching the count of new feed items since a given post ID.
 */
export const useNewFeedItemsCount = (since: Date | undefined) => {
  const { data, loading, error, refetch } = useQuery<{ getNewFeedItemsCount: number }>(
    buildGetNewFeedItemsCountQuery(),
    {
      variables: since ? { since: since.toISOString() } : undefined,
      skip: !since,
      fetchPolicy: 'network-only',
    }
  );

  return { count: data?.getNewFeedItemsCount ?? 0, loading, error, refreshCount: refetch};
};

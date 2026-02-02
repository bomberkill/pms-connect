import { useQuery, useMutation } from '@apollo/client';
import { useState, useEffect } from 'react';
import {
  buildGetFeedQuery,
  buildGetPostByIdQuery,
  buildGetPostsByAuthorQuery,
  buildGetPostsByGroupQuery,
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
 * Hook for fetching the main feed with Twitter-style new posts notification support.
 * Implements smart prefetch: automatically fetches new posts when badge appears (up to 15 posts)
 */
export const useFeed = (options: { limit?: number; enablePolling?: boolean } = {}) => {
  const { limit = 10, enablePolling = false } = options;

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery<{ getFeed: Post[] }>(
    buildGetFeedQuery(),
    {
      variables: { limit, skip: 0 },
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: true,
      // REMOVED: pollInterval - we don't want to auto-fetch new posts
    }
  );

  const posts: Post[] = data?.getFeed || [];

  // Track when user last viewed the feed (for new posts detection)
  const [lastViewedAt, setLastViewedAt] = useState<Date>(new Date());

  // Prefetch state - stores posts fetched in background
  const [prefetchedPosts, setPrefetchedPosts] = useState<Post[] | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isLoadingNewPosts, setIsLoadingNewPosts] = useState(false);

  // Get count of new posts since last viewed - THIS will poll, not the main query
  const { count: newPostsCount, refreshCount } = useNewFeedItemsCount(lastViewedAt, enablePolling);

  // Smart prefetch: fetch new posts in background when badge appears
  // Limit to 15 posts to avoid network overload (Twitter-style)
  const PREFETCH_LIMIT = 15;

  useEffect(() => {
    if (newPostsCount > 0 && !prefetchedPosts && !isPrefetching) {
      setIsPrefetching(true);

      // Determine how many posts to prefetch
      const prefetchCount = Math.min(newPostsCount, PREFETCH_LIMIT);

      // Prefetch in background (silent - no loading state shown to user)
      refetch({ skip: 0, limit: prefetchCount })
        .then((result) => {
          if (result.data?.getFeed) {
            setPrefetchedPosts(result.data.getFeed);
          }
        })
        .catch((err) => {
          console.error('Prefetch failed:', err);
          // Silently fail - user can still click badge to fetch normally
        })
        .finally(() => {
          setIsPrefetching(false);
        });
    }
  }, [newPostsCount, prefetchedPosts, isPrefetching, refetch]);

  const loadMore = async () => {
    await fetchMore({
      variables: {
        skip: posts.length,
        limit,
      },
    });
  };

  const refresh = async () => {
    await refetch(); // 🔁 Recharge le flux depuis le backend (rafraîchit le cache)
  };

  /**
   * Load new posts and scroll to top (Twitter-style)
   * Optimized: uses prefetched posts from cache, no redundant refetch
   * Shows loading state only if prefetch hasn't completed yet
   */
  const loadNewPosts = async () => {
    setLastViewedAt(new Date());

    // If we have prefetched posts, they're already in Apollo cache
    // No need to refetch - just clear state and let cache update UI
    if (prefetchedPosts) {
      setPrefetchedPosts(null);
      // Posts are already in cache from prefetch refetch
      // Apollo will automatically merge them into the feed
    } else {
      // Prefetch hasn't completed yet - show loader and fetch
      setIsLoadingNewPosts(true);
      try {
        await refetch({ skip: 0, limit });
      } finally {
        setIsLoadingNewPosts(false);
      }
    }

    // Refresh count to reset badge
    await refreshCount();
  };

  return {
    posts,
    loading,
    error,
    loadMore,
    refresh,
    isRefetching: networkStatus === 4,
    newPostsCount,
    loadNewPosts,
    lastViewedAt,
    hasPrefetchedPosts: !!prefetchedPosts, // Expose for debugging/UI
    isLoadingNewPosts, // Expose for loader display
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
 * This hook can poll to check for new posts without fetching the actual posts.
 */
export const useNewFeedItemsCount = (since: Date | undefined, enablePolling: boolean = false) => {
  const { data, loading, error, refetch } = useQuery<{ getNewFeedItemsCount: number }>(
    buildGetNewFeedItemsCountQuery(),
    {
      variables: since ? { since: since.toISOString() } : undefined,
      skip: !since,
      fetchPolicy: 'network-only',
      pollInterval: enablePolling ? 30000 : undefined, // Poll every 30 seconds if enabled
    }
  );

  return { count: data?.getNewFeedItemsCount ?? 0, loading, error, refreshCount: refetch };
};

/**
 * Hook to fetch posts by a specific author.
 */
export const usePostsByAuthor = (authorId: string, options: { limit?: number; skip?: number } = {}) => {
  const { limit = 10, skip = 0 } = options;

  const { data, loading, error, fetchMore } = useQuery<{ getPostsByAuthor: Post[] }>(
    buildGetPostsByAuthorQuery(),
    {
      variables: { authorId, limit, skip },
      skip: !authorId || authorId.trim() === '',
      fetchPolicy: 'cache-and-network',
    }
  );

  const posts: Post[] = data?.getPostsByAuthor || [];

  const loadMore = async () => {
    await fetchMore({
      variables: {
        skip: posts.length,
        limit,
      },
    });
  };

  return {
    posts,
    loading,
    error,
    loadMore,
  };
};

/**
 * Hook to fetch posts by a specific user (alias for usePostsByAuthor).
 */
export const useUserPosts = (authorId: string, options: { limit?: number; skip?: number } = {}) => {
  return usePostsByAuthor(authorId, options);
};

/**
 * Hook to fetch posts by a specific group.
 */
export const useGroupPosts = (groupId: string, options: { limit?: number; skip?: number } = {}) => {
  const { limit = 10, skip = 0 } = options;
  const { data, loading, error, fetchMore, refetch } = useQuery<{ getPostsByGroup: Post[] }>(
    buildGetPostsByGroupQuery(),
    {
      variables: { groupId, limit, skip },
      skip: !groupId || groupId.trim() === '',
      fetchPolicy: 'cache-and-network',
    }
  );

  const posts = data?.getPostsByGroup || [];

  const loadMore = () => {
    if (fetchMore) {
      return fetchMore({
        variables: {
          skip: posts.length,
        },
      });
    }
  };

  return {
    posts,
    loading,
    error,
    loadMore,
    refetch,
  };
};

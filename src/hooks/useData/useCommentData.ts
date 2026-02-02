import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  buildGetCommentsByPostQuery,
  buildAddCommentMutation,
  buildRemoveCommentMutation,
  buildGetCommentRepliesQuery,
  buildCommentAddedSubscription,
  buildGetCommentByIdQuery
} from '@/graphql/queries/index';
import { Comment, CreateCommentInput } from '@/types/Comment';

// =============================================================================
// == COMMENTS
// =============================================================================

/**
 * Hook to fetch comments for a post.
 */
export const useComments = (postId: string, isComment?: boolean, options: { limit?: number } = {}) => {
  const { limit = 10 } = options;
  const safePostId = postId?.trim();
  const { data, loading, error, fetchMore } = useQuery<{ getCommentsByPost: Comment[] }>(
    buildGetCommentsByPostQuery(),
    {
      variables: safePostId ? { postId: safePostId, limit, skip: 0 } : undefined,
      fetchPolicy: 'cache-and-network',
      skip: !safePostId || isComment,
    }
  );

  const comments: Comment[] = data?.getCommentsByPost || [];

  return {
    comments,
    loading,
    error,
    loadMore: () => fetchMore({
      variables: {
        skip: comments.length,
      },
    })
  };
};


export const useComment = (commentId: string, isComment?: boolean) => {
  const { data, loading, error } = useQuery<{ getCommentById: Comment }>(
    buildGetCommentByIdQuery(),
    {
      variables: { id: commentId },
      skip: !commentId || commentId.trim() === '' || !isComment,
    }
  );

  return { comment: data?.getCommentById, loading, error };
}

/**
 * Hook that provides comment mutation actions (add, remove) with optimized cache updates.
 */
export const useCommentActions = () => {
  const [addComment, { loading: adding, error: addError }] = useMutation<
    { addComment: Comment }, { createCommentInput: CreateCommentInput }
  >(buildAddCommentMutation(), {
    update(cache, { data }, { variables }) {
      if (!data?.addComment) return;

      const newComment = data.addComment;
      const postId = newComment.post?.id || newComment.post?.id;
      const parentId = (variables?.createCommentInput as CreateCommentInput)?.parentId;

      // Update post's comment count
      if (postId) {
        cache.modify({
          id: `Post:${postId}`,
          fields: {
            commentsCount(currentCount = 0) { return currentCount + 1; }
          }
        });

        // Add comment to the comments list if it's a top-level comment
        if (!parentId) {
          try {
            const existingComments = cache.readQuery<{ getCommentsByPost: Comment[] }>({
              query: buildGetCommentsByPostQuery(),
              variables: { postId, limit: 10, skip: 0 },
            });

            if (existingComments) {
              cache.writeQuery({
                query: buildGetCommentsByPostQuery(),
                variables: { postId, limit: 10, skip: 0 },
                data: {
                  getCommentsByPost: [newComment, ...existingComments.getCommentsByPost],
                },
              });
            }
          } catch {
            // Query might not be in cache yet, that's okay
          }
        } else {
          // Add reply to the replies list
          try {
            const existingReplies = cache.readQuery<{ getCommentReplies: Comment[] }>({
              query: buildGetCommentRepliesQuery(),
              variables: { parentId, limit: 10, skip: 0 },
            });

            if (existingReplies) {
              cache.writeQuery({
                query: buildGetCommentRepliesQuery(),
                variables: { parentId, limit: 10, skip: 0 },
                data: {
                  getCommentReplies: [newComment, ...existingReplies.getCommentReplies],
                },
              });
            }
          } catch {
            // Query might not be in cache yet, that's okay
          }
        }
      }
    },
  });

  const [removeComment, { loading: removing, error: removeError }] = useMutation<
    { removeComment: boolean }, { commentId: string }
  >(buildRemoveCommentMutation());

  return { addComment, adding, addError, removeComment, removing, removeError };
};

/**
 * Hook to fetch replies for a comment.
 */
export const useCommentReplies = (parentId: string, isComment?: boolean, options: { limit?: number } = {}) => {
  const { limit = 10 } = options;
  const safeParentId = parentId?.trim();

  const { data, loading, error, fetchMore } = useQuery<{ getCommentReplies: Comment[] }>(
    buildGetCommentRepliesQuery(),
    {
      variables: safeParentId ? { parentId: safeParentId, limit, skip: 0 } : undefined,
      skip: !safeParentId || !isComment,
      fetchPolicy: 'cache-and-network',
    }
  );

  const replies: Comment[] = data?.getCommentReplies || [];

  return {
    replies,
    loading,
    error,
    loadMore: () => fetchMore({
      variables: {
        skip: replies.length,
      },
    }),
  };
};

export const useCommentSubscription = (postId: string) => {
  const { data, loading, error } = useSubscription<{ commentAdded: string }>(buildCommentAddedSubscription(), {
    variables: { postId }
  })
  return { commentAdded: data?.commentAdded, loading, error }
}

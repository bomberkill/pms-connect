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
  const { data, loading, error, fetchMore } = useQuery<{ getCommentsByPost: Comment[] }>(
    buildGetCommentsByPostQuery(),
    {
      variables: { postId, limit, skip: 0 },
      fetchPolicy: 'cache-and-network',
      skip: !postId || isComment,
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
      skip: !commentId || !isComment,
    }
  );

  return { comment: data?.getCommentById, loading, error };
}

/**
 * Hook that provides comment mutation actions (add, remove).
 */
export const useCommentActions = () => {
  const [addComment, { loading: adding, error: addError }] = useMutation<
    { addComment: Comment }, { createCommentInput: CreateCommentInput }
  >(buildAddCommentMutation(), {
    update(cache, { data }) {
      if (!data?.addComment) return;
      // This update is tricky because we don't know the post ID from the response if it's not returned.
      // Assuming the post ID is part of the comment response.
      const post = (data.addComment).post;
      if (post) {
        cache.modify({
          id: `Post:${post.id}`,
          fields: {
            commentsCount(currentCount = 0) { return currentCount + 1; }
          }
        });
      }
    },
    refetchQueries: ['GetCommentsByPost', 'GetCommentReplies'],
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

  const { data, loading, error, fetchMore } = useQuery<{ getCommentReplies: Comment[] }>(
    buildGetCommentRepliesQuery(),
    {
      variables: { parentId, limit, skip: 0 },
      skip: !parentId || !isComment,
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
  const {data, loading, error} = useSubscription<{commentAdded: string}>(buildCommentAddedSubscription(), {
    variables: {postId}
  })
  return {commentAdded: data?.commentAdded, loading, error}
}

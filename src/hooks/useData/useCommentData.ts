import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import {
  buildGetCommentsByPostQuery,
  buildAddCommentMutation,
  buildRemoveCommentMutation,
  buildGetCommentRepliesQuery,
  buildCommentAddedSubscription,
  buildGetCommentByIdQuery,
  COMMENT_FIELDS
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
      fetchPolicy: 'cache-and-network',
      skip: !commentId || commentId.trim() === '' || !isComment,
    }
  );

  return { comment: data?.getCommentById, loading, error };
}

import { useMe } from './useUserData';
import { CommentStatus } from '@/types/Comment';
import { Post } from '@/types/Post';

/**
 * Hook that provides comment mutation actions (add, remove) with optimized cache updates.
 */
export const useCommentActions = () => {
  const { me } = useMe();
  const [addComment, { loading: adding, error: addError }] = useMutation<
    { addComment: Comment }, { createCommentInput: CreateCommentInput }
  >(buildAddCommentMutation(), {
    optimisticResponse: (variables) => {
      const { createCommentInput } = variables;
      if (!me) return undefined as unknown as { addComment: Comment }; // Fix TS error for undefined

      return {
        addComment: {
          __typename: 'Comment',
          id: `temp-${Date.now()}`,
          content: createCommentInput.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likesCount: 0,
          commentsCount: 0,
          status: CommentStatus.VISIBLE,
          author: me,
          post: { __typename: 'Post', id: createCommentInput.postId } as unknown as Post,
          parent: createCommentInput.parentId ? { __typename: 'Comment', id: createCommentInput.parentId } as unknown as Comment : null,
          media: createCommentInput.media || [],
          isLiked: false,
          isBookmarked: false,
        } as Comment
      };
    },
    update(cache, { data }, { variables }) {
      if (!data?.addComment) return;

      const newComment = data.addComment;
      // Use postId from variables as optimistic response might have partial post object
      const postId = (variables?.createCommentInput as CreateCommentInput)?.postId;
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
          cache.modify({
            fields: {
              getCommentsByPost(existingComments = []) {
                const newCommentRef = cache.writeFragment({
                  data: newComment,
                  fragment: gql`
                    fragment NewComment on Comment {
                      ${COMMENT_FIELDS}
                    }
                  `
                });
                return [newCommentRef, ...existingComments];
              }
            }
          });
        } else {
          // Add reply to the replies list
          cache.modify({
            fields: {
              getCommentReplies(existingReplies = []) {
                const newCommentRef = cache.writeFragment({
                  data: newComment,
                  fragment: gql`
                    fragment NewReply on Comment {
                      ${COMMENT_FIELDS}
                    }
                  `
                });
                return [newCommentRef, ...existingReplies];
              }
            }
          });
        }
      }
    },
  });

  const [removeComment, { loading: removing, error: removeError }] = useMutation<
    { removeComment: boolean }, { commentId: string }
  >(buildRemoveCommentMutation(), {
    // TODO: Add optimistic response for removal if needed (requires finding parent ID/post ID to decrement counts)
    update(cache, { data }, { variables }) {
      if (data?.removeComment && variables?.commentId) {
        cache.evict({ id: `Comment:${variables.commentId}` });
        cache.gc();
      }
    }
  });

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

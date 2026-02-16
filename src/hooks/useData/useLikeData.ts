import { useMutation, useSubscription } from '@apollo/client';
import {
  buildLikePostMutation,
  buildUnlikePostMutation,
  buildLikeCommentMutation,
  buildUnlikeCommentMutation,
  buildLikesUpdatedSubscription,
} from '@/graphql/queries/index';
import { LikesUpdate } from '@/types/Like';

/**
 * Hook for like/unlike actions on a post.
 */
export const useLikePostActions = (postId: string) => {
  const [likePost, { loading: liking }] = useMutation(buildLikePostMutation(), {
    variables: { postId },
    optimisticResponse: {
      likePost: true,
    },
    update: (cache) => {
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: postId }),
        fields: {
          isLiked: () => true,
          likesCount: (existingCount: number = 0, { readField }) => {
            const isLiked = readField('isLiked');
            return isLiked ? existingCount : existingCount + 1;
          },
        },
      });
    },
  });

  const [unlikePost, { loading: unliking }] = useMutation(buildUnlikePostMutation(), {
    variables: { postId },
    optimisticResponse: {
      unlikePost: true,
    },
    update: (cache) => {
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: postId }),
        fields: {
          isLiked: () => false,
          likesCount: (existingCount: number = 0, { readField }) => {
            const isLiked = readField('isLiked');
            return isLiked ? existingCount - 1 : existingCount;
          },
        },
      });
    },
  });

  return { likePost, liking, unlikePost, unliking };
};



/**
 * Hook for like/unlike actions on a comment.
 */
export const useLikeCommentActions = (commentId: string) => {
  const [likeComment, { loading: liking }] = useMutation(buildLikeCommentMutation(), {
    variables: { commentId },
    optimisticResponse: {
      likeComment: true,
    },
    update: (cache) => {
      cache.modify({
        id: cache.identify({ __typename: 'Comment', id: commentId }),
        fields: {
          isLiked: () => true,
          likesCount: (existingCount: number = 0, { readField }) => {
            const isLiked = readField('isLiked');
            return isLiked ? existingCount : existingCount + 1;
          },
        },
      });
    },
  });

  const [unlikeComment, { loading: unliking }] = useMutation(buildUnlikeCommentMutation(), {
    variables: { commentId },
    optimisticResponse: {
      unlikeComment: true,
    },
    update: (cache) => {
      cache.modify({
        id: cache.identify({ __typename: 'Comment', id: commentId }),
        fields: {
          isLiked: () => false,
          likesCount: (existingCount: number = 0, { readField }) => {
            const isLiked = readField('isLiked');
            return isLiked ? existingCount - 1 : existingCount;
          },
        },
      });
    },
  });

  return { likeComment, liking, unlikeComment, unliking };
};

/**
 * Hook for subscribing to likes updates on a likeable item.
 */
export const useLikesSubscription = (likeableId: string, likeableType: string) => {
  const { data, loading, error } = useSubscription<{ likesUpdated: LikesUpdate }>(
    buildLikesUpdatedSubscription(),
    { variables: { likeableId, likeableType }, skip: !likeableId || !likeableType }
  );

  return { likesUpdate: data?.likesUpdated, loading, error };
};

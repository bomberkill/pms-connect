import { useMutation, useSubscription, gql } from '@apollo/client';
import {
  buildLikePostMutation,
  buildUnlikePostMutation,
  buildLikeCommentMutation,
  buildUnlikeCommentMutation,
  buildLikesUpdatedSubscription,
} from '@/graphql/queries/index';
import { Post } from '@/types/Post';
import { Comment } from '@/types/Comment';
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
      const id = `Post:${postId}`;
      const fragment = gql`
        fragment MyPost on Post {
          isLiked
          likesCount
        }
      `;
      const post = cache.readFragment<Post>({ id, fragment });
      if (post) {
        cache.writeFragment({
          id,
          fragment,
          data: {
            ...post,
            isLiked: true,
            likesCount: post.likesCount + 1,
          },
        });
      }
    },
  });

  const [unlikePost, { loading: unliking }] = useMutation(buildUnlikePostMutation(), {
    variables: { postId },
    optimisticResponse: {
      unlikePost: true,
    },
    update: (cache) => {
      const id = `Post:${postId}`;
      const fragment = gql`
        fragment MyPost on Post {
          isLiked
          likesCount
        }
      `;
      const post = cache.readFragment<Post>({ id, fragment });
      if (post) {
        cache.writeFragment({
          id,
          fragment,
          data: {
            ...post,
            isLiked: false,
            likesCount: post.likesCount - 1,
          },
        });
      }
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
      const id = `Comment:${commentId}`;
      const fragment = gql`
        fragment MyComment on Comment {
          isLiked
          likesCount
        }
      `;
      const comment = cache.readFragment<Comment>({ id, fragment });
      if (comment) {
        cache.writeFragment({
          id,
          fragment,
          data: {
            ...comment,
            isLiked: true,
            likesCount: (comment.likesCount || 0) + 1,
          },
        });
      }
    },
  });

  const [unlikeComment, { loading: unliking }] = useMutation(buildUnlikeCommentMutation(), {
    variables: { commentId },
    optimisticResponse: {
      unlikeComment: true,
    },
    update: (cache) => {
      const id = `Comment:${commentId}`;
      const fragment = gql`
        fragment MyComment on Comment {
          isLiked
          likesCount
        }
      `;
      const comment = cache.readFragment<Comment>({ id, fragment });
      if (comment) {
        cache.writeFragment({
          id,
          fragment,
          data: {
            ...comment,
            isLiked: false,
            likesCount: (comment.likesCount || 0) - 1,
          },
        });
      }
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

import { gql } from "@apollo/client";

const LIKE_UPDATE_FIELDS = `
  likeableId
  likeableType
  likesCount
`;

/**
 * Builds a GraphQL mutation for liking a post.
 */
export const buildLikePostMutation = () => {
  return gql`
    mutation LikePost($postId: ID!) {
      likePost(postId: $postId)
    }
  `;
};

/**
 * Builds a GraphQL mutation for unliking a post.
 */
export const buildUnlikePostMutation = () => {
  return gql`
    mutation UnlikePost($postId: ID!) {
      unlikePost(postId: $postId)
    }
  `;
};

/**
 * Builds a GraphQL mutation for liking a comment.
 */
export const buildLikeCommentMutation = () => {
  return gql`
    mutation LikeComment($commentId: ID!) {
      likeComment(commentId: $commentId)
    }
  `;
};

/**
 * Builds a GraphQL mutation for unliking a comment.
 */
export const buildUnlikeCommentMutation = () => {
  return gql`
    mutation UnlikeComment($commentId: ID!) {
      unlikeComment(commentId: $commentId)
    }
  `;
};

/**
 * Builds a GraphQL subscription for likes updates.
 */
export const buildLikesUpdatedSubscription = (meta?: { fields?: string }) => {
    const fields = meta?.fields || LIKE_UPDATE_FIELDS;
  return gql`
    subscription LikesUpdated($likeableId: ID!, $likeableType: String!) {
      likesUpdated(likeableId: $likeableId, likeableType: $likeableType) {
        ${fields}
      }
    }
  `;
};
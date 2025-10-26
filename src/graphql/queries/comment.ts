import { gql } from "@apollo/client";

const COMMENT_FIELDS = `
  id
  content
  createdAt
  updatedAt
  media {
    url
    type
  }
  author {
    id
    userType
    slug
    profilePicUrl
    ... on IndividualUserObject {
      firstName
      lastName
      professionalTitle
    }
    ... on LegalEntityUserObject {
      entityName
      entityType
    }
  }
  post {
    id
    content
    author {
      id
      userType
      profilePicUrl
      ... on IndividualUserObject {
        firstName
        lastName
        professionalTitle
      }
      ... on LegalEntityUserObject {
      entityName
      entityType
      }
    }
  }
  parent {
    id
    content
    createdAt
    updatedAt
    author {
      id
      profilePicUrl
      ... on IndividualUserObject {
        firstName
        lastName
        professionalTitle
      }
      ... on LegalEntityUserObject {
      entityName
      entityType
      }
    }
  }
  likesCount
  commentsCount
  isLiked
  status
`;

/**
 * Builds a GraphQL mutation for adding a comment to a post.
 */
export const buildAddCommentMutation = (meta?: { fields?: string }) => {
  const fields = meta?.fields || COMMENT_FIELDS;
  return gql`
    mutation AddComment($createCommentInput: CreateCommentInput!) {
      addComment(createCommentInput: $createCommentInput) {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL query for fetching comments for a specific post.
 */
export const buildGetCommentsByPostQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || COMMENT_FIELDS;
  return gql`
    query GetCommentsByPost($postId: ID!, $limit: Int, $skip: Int) {
      getCommentsByPost(postId: $postId, limit: $limit, skip: $skip) {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL mutation for removing a comment.
 */
export const buildRemoveCommentMutation = () => {
  return gql`
    mutation RemoveComment($commentId: ID!) {
      removeComment(commentId: $commentId)
    }
  `;
};

/**
 * Builds a GraphQL subscription for when a new comment is added.
 */
export const buildCommentAddedSubscription = () => {
  // const fields = meta?.fields || COMMENT_FIELDS;
  return gql`
    subscription CommentAdded($postId: ID!) {
      commentAdded(postId: $postId)
    }
  `;
};

/**
 * Builds a GraphQL query for fetching replies for a specific comment.
 */
export const buildGetCommentRepliesQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || COMMENT_FIELDS;
  return gql`
    query GetCommentReplies($parentId: ID!, $limit: Int, $skip: Int) {
      getCommentReplies(parentId: $parentId, limit: $limit, skip: $skip) {
        ${fields}
      }
    }
  `;
};

export const buildGetCommentByIdQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || COMMENT_FIELDS;
  return gql`
    query GetCommentById($id: ID!) {
      getCommentById(id: $id) {
        ${fields}
      }
    }
  `;
}

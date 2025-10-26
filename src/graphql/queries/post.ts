import { gql } from "@apollo/client";

const POST_FIELDS = `
  id
  content
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
  likesCount
  commentsCount
  viewsCount
  sharesCount
  createdAt
  updatedAt
  isLiked
  status
`;

// =============================================================================
// == POST & COMMENT QUERIES & MUTATIONS
// =============================================================================

/**
 * Builds a GraphQL query for fetching a feed of posts.
 */
export const buildGetFeedQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || POST_FIELDS;
  return gql`
    query GetFeed($limit: Int, $skip: Int) {
      getFeed(limit: $limit, skip: $skip) {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL query for fetching a single post by its ID.
 */
export const buildGetPostByIdQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || POST_FIELDS;
  return gql`
    query GetPostById($id: ID!) {
      getPostById(id: $id) {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL mutation for creating a new post.
 */
export const buildCreatePostMutation = (meta?: { fields?: string }) => {
  const fields = meta?.fields || POST_FIELDS;
  return gql`
    mutation CreatePost($createPostInput: CreatePostInput!) {
      createPost(createPostInput: $createPostInput) {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL mutation for updating an existing post.
 */
export const buildUpdatePostMutation = (meta?: { fields?: string }) => {
  const fields = meta?.fields || POST_FIELDS;
  return gql`
    mutation UpdatePost($postId: ID!, $updatePostInput: UpdatePostInput!) {
      updatePost(postId: $postId, updatePostInput: $updatePostInput) {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL mutation for removing a post.
 */
export const buildRemovePostMutation = () => {
  return gql`
    mutation RemovePost($id: ID!) {
      removePost(id: $id)
    }
  `;
};

/**
 * Builds a GraphQL query for fetching the count of new feed items.
 */
export const buildGetNewFeedItemsCountQuery = () => {
  return gql`
    query GetNewFeedItemsCount($since: DateTime!) {
      getNewFeedItemsCount(since: $since)
    }
  `;
};

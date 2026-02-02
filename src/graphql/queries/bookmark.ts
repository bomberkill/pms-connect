import { gql } from "@apollo/client";

// const BOOKMARK_FIELDS = `
//   id
//   item {
//     ... on Post {
//       id
//       content
//       author {
//         id
//         profilePicUrl
//         ... on IndividualUserObject {
//             firstName
//             lastName
//             professionalTitle
//         }
//         ... on LegalEntityUserObject {
//         entityName
//         entityType
//         }
//       }
//       createdAt
//       updatedAt
//     }
//     ... on Comment {
//       id
//       content
//       author {
//         id
//         profilePicUrl
//         ... on IndividualUserObject {
//             firstName
//             lastName
//             professionalTitle
//         }
//         ... on LegalEntityUserObject {
//         entityName
//         entityType
//         }
//       }
//       post {
//         id
//       }
//       createdAt
//       updatedAt
//     }
//   }
//   createdAt
// `;

// =============================================================================
// == BOOKMARK QUERIES & MUTATIONS
// =============================================================================

/**
 * Builds a GraphQL mutation for adding a bookmark.
 * Corresponds to 'addBookmark' resolver in users.resolver.ts.
 * @param meta - Optional metadata, can include 'fields'.
 * @returns A gql object.
 */
export const buildAddBookmarkMutation = () => {
  // const fields = meta?.fields || BOOKMARK_FIELDS;
  return gql`
    mutation AddBookmark($itemId: ID!, $itemType: BookmarkableType!) {
      addBookmark(itemId: $itemId, itemType: $itemType)
    }
  `;
};

/**
 * Builds a GraphQL mutation for removing a bookmark.
 * Corresponds to 'removeBookmark' resolver in users.resolver.ts.
 * @param meta - Optional metadata, can include 'fields'.
 * @returns A gql object.
 */
export const buildRemoveBookmarkMutation = () => {
  return gql`
    mutation RemoveBookmark($itemId: ID!) {
      removeBookmark(itemId: $itemId)
    }
  `;
};

/**
 * Builds a GraphQL query for fetching the current user's bookmarks.
 * Corresponds to 'myBookmarks' resolver in bookmarks.resolver.ts.
 * @returns A gql object.
 */
export const buildGetMyBookmarksQuery = () => {
  return gql`
    query MyBookmarks($skip: Int, $limit: Int) {
      myBookmarks(skip: $skip, limit: $limit) {
        id
        createdAt
        item {
          ... on Post {
            id
            content
            media {
              url
              type
            }
            author {
              id
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
            createdAt
          }
          ... on Comment {
            id
            content
            author {
              id
              slug
              profilePicUrl
              ... on IndividualUserObject {
                firstName
                lastName
              }
              ... on LegalEntityUserObject {
                entityName
              }
            }
            post {
              id
            }
            createdAt
          }
        }
      }
    }
  `;
};
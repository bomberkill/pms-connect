// import { gql } from "@apollo/client";

// /**
//  * Default fields for User. Adjust as needed.
//  * This helps avoid repeating field lists everywhere.
//  * Corresponds to users.model.ts User InterfaceType and its implementations.
//  */
// const USER_FIELDS = `
//   id
//   firebaseUid
//   email
//   slug
//   userType
//   profilePicUrl
//   coverPicUrl
//   bio
//   websiteUrl
//   accountStatus
//   connections
//   followers
//   following
//   blockedUsers
//   fcmTokens
//   language
//   createdAt
//   updatedAt
//   lastLoginAt
//   location {
//     addressLine1
//     addressLine2
//     city
//     stateOrProvince
//     postalCode
//     country
//   }
//   professionalAccreditation {
//     accreditationType
//     referenceNumber
//     documentUrl
//     issueDate
//     expirationDate
//     issuingAuthority
//   }
//   ... on IndividualUserObject { # Specific fields for IndividualUser
//     firstName
//     lastName
//     speciality
//     professionalTitle
//   }
//   ... on LegalEntityUserObject { # Specific fields for LegalEntityUser
//     entityName
//     entityType
//   }
// `;

// const CONNECTION_REQUEST_FIELDS = `
//   id
//   status
//   createdAt
//   updatedAt
//   requester {
//     id
//     slug
//     profilePicUrl
//     ... on IndividualUserObject {
//       firstName
//       lastName
//       professionalTitle
//     }
//     ... on LegalEntityUserObject {
//       entityName
//       entityType
//     }
//   }
//   recipient {
//     id
//     slug
//     profilePicUrl
//     ... on IndividualUserObject {
//       firstName
//       lastName
//     }
//     ... on LegalEntityUserObject {
//       entityName
//       entityType
//     }
//   }
// `;

// const COMMENT_FIELDS = `
//   id
//   content
//   createdAt
//   updatedAt
//   media {
//     url
//     type
//   }
//   author {
//     id
//     slug
//     profilePicUrl
//     ... on IndividualUserObject {
//       firstName
//       lastName
//     }
//     ... on LegalEntityUserObject {
//       entityName
//       entityType
//     }
//   }
//   post {
//     id
//     content
//     author {
//       id
//       profilePicUrl
//       ... on IndividualUserObject {
//         firstName
//         lastName
//       }
//       ... on LegalEntityUserObject {
//       entityName
//       entityType
//       }
//     }
//   }
//   parent {
//     id
//     content
//     createdAt
//     updatedAt
//     author {
//       id
//       profilePicUrl
//       ... on IndividualUserObject {
//         firstName
//         lastName
//       }
//       ... on LegalEntityUserObject {
//       entityName
//       entityType
//       }
//     }
//   }
//   likesCount
//   commentsCount
//   isLiked
//   status
// `;

// const POST_FIELDS = `
//   id
//   content
//   media {
//     url
//     type
//   }
//   author {
//     id
//     userType
//     slug
//     profilePicUrl
//     ... on IndividualUserObject {
//       firstName
//       lastName
//       professionalTitle
//     }
//     ... on LegalEntityUserObject {
//       entityName
//       entityType
//     }
//   }
//   likesCount
//   commentsCount
//   viewsCount
//   sharesCount
//   createdAt
//   updatedAt
//   isLiked
//   status
// `;

// const CHECK_USER_FIELDS = `
//   exists
//   hasPassword
//   providers
//   `;

// // =============================================================================
// // == USER QUERIES & MUTATIONS
// // =============================================================================
// export const buildGetAllUsersQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || USER_FIELDS;
//   return gql`
//     query GetAllUsers($skip: Int, $limit: Int, $userType: UserType) { # Arguments from GetAllUsersArgs
//       getAllUsers(skip: $skip, limit: $limit, userType: $userType) {
//         ${fields}
//       }
//       # For total count, your API needs to provide it. Example:
//       # allUsersCount(userType: $userType)
//     }
//   `;
// };

// /**
//  * Builds a GraphQL query for fetching a single user by ID.
//  * Corresponds to 'user' resolver in users.resolver.ts.
//  * @param meta - Optional metadata, can include 'fields'.
//  * @returns A gql object.
//  */
// export const buildGetUserByIdQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || USER_FIELDS;
//   return gql`
//     query GetUserById($id: ID!) {
//       getUserById(id: $id) { # 'user' is the query name
//         ${fields}
//       }
//     }
//   `;
// };

// export const buildGetMeQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || USER_FIELDS;
//   return gql`
//     query GetMe {
//       me{ # 'user' is the query name
//         ${fields}
//       }
//     }
//   `;
// };

// export const buildGetUserBySlugQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || USER_FIELDS;
//   return gql`
//     query GetUserBySlug($slug: String!) {
//       getUserBySlug(slug: $slug) { # 'user' is the query name
//         ${fields}
//       }
//     }
//   `;
// };

// /* Builds a GraphQL mutation for creating a user.
// * Corresponds to 'createUser' resolver in users.resolver.ts.
// * @param meta - Optional metadata.
// * @returns A gql object.
// */
// export const buildCreateUserMutation = (meta?: { fields?: string }) => {
//  const fields = meta?.fields || USER_FIELDS;
//  return gql`
//    mutation CreateUser($createUserInput: CreateUserInput!) { # Argument name from resolver
//      createUser(createUserInput: $createUserInput) { # 'createUser' is the mutation name
//        ${fields}
//      }
//    }
//  `;
// };

// /**
//  * Builds a GraphQL mutation for updating the current user's profile.
//  * Corresponds to 'updateMyProfile' resolver in users.resolver.ts.
//  * @param meta - Optional metadata.
//  * @returns A gql object.
//  */
// export const buildUpdateMyProfileMutation = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || USER_FIELDS;
//   return gql`
//     mutation UpdateMyProfile($updateUserInput: UpdateUserInput!) { # Argument name from resolver
//       updateMyProfile(updateUserInput: $updateUserInput) { # 'updateMyProfile' is the mutation name
//         ${fields}
//       }
//     }
//   `;
// };

// // =============================================================================
// // == FOLLOW QUERIES & MUTATIONS
// // =============================================================================

// /**
//  * Builds a GraphQL mutation for following a user.
//  * Corresponds to 'follow' resolver in users.resolver.ts.
//  * @returns A gql object.
//  */
// export const buildFollowMutation = () => {
//   return gql`
//     mutation Follow($userId: ID!) {
//       follow(userId: $userId)
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for unfollowing a user.
//  * Corresponds to 'unfollow' resolver in users.resolver.ts.
//  * @returns A gql object.
//  */
// export const buildUnfollowMutation = () => {
//   return gql`
//     mutation Unfollow($userId: ID!) {
//       unfollow(userId: $userId)
//     }
//   `;
// };

// const FOLLOWS_UPDATE_FIELDS = `
//   follower {
//     userId
//     foolowersCount
//   }
//   following {
//     userId
//     followingCount
//   }
// `;

// /**
//  * Builds a GraphQL subscription to listen for updates on a user's followers/following count.
//  * Corresponds to the 'followsUpdated' subscription in the resolver.
//  * @param meta - Optional metadata, can include 'fields'.
//  * @returns A gql object.
//  */
// export const buildFollowsUpdatedSubscription = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || FOLLOWS_UPDATE_FIELDS;
//   return gql`
//     subscription FollowsUpdated($userId: ID!) {
//       followsUpdated(userId: $userId) {
//         ${fields}
//       }
//     }
//   `;
// };

// // =============================================================================
// // == CONNECTION QUERIES & MUTATIONS
// // =============================================================================

// /**
//  * Builds a GraphQL query for fetching the current user's connection requests.
//  * Corresponds to 'getMyConnectionRequests' resolver in users.resolver.ts.
//  * @param meta - Optional metadata, can include 'fields'.
//  * @returns A gql object.
//  */
// export const buildGetMyConnectionRequestsQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || CONNECTION_REQUEST_FIELDS;
//   return gql`
//     query GetMyConnectionRequests($status: ConnectionRequestStatusGQL) {
//       getMyConnectionRequests(status: $status) {
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for sending a connection request.
//  * Corresponds to 'sendConnectionRequest' resolver in users.resolver.ts.
//  * @returns A gql object.
//  */
// export const buildSendConnectionRequestMutation = () => {
//   return gql`
//     mutation SendConnectionRequest($recipientId: ID!) {
//       sendConnectionRequest(recipientId: $recipientId)
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for accepting a connection request.
//  * Corresponds to 'acceptConnectionRequest' resolver in users.resolver.ts.
//  * @returns A gql object.
//  */
// export const buildAcceptConnectionRequestMutation = () => {
//   return gql`
//     mutation AcceptConnectionRequest($requestId: ID!) {
//       acceptConnectionRequest(requestId: $requestId)
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for declining or canceling a connection request.
//  * Corresponds to 'declineOrCancelConnectionRequest' resolver in users.resolver.ts.
//  * @returns A gql object.
//  */
// export const buildDeclineOrCancelConnectionRequestMutation = () => {
//   return gql`
//     mutation DeclineOrCancelConnectionRequest($requestId: ID!) {
//       declineOrCancelConnectionRequest(requestId: $requestId)
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for removing a connection.
//  * Corresponds to 'removeConnection' resolver in users.resolver.ts.
//  * @returns A gql object.
//  */
// export const buildRemoveConnectionMutation = () => {
//   return gql`
//     mutation RemoveConnection($userIdB: ID!) {
//       removeConnection(userIdB: $userIdB)
//     }
//   `;
// };

// /**
//  * Builds a GraphQL subscription to listen for updates on connection requests.
//  * Corresponds to the 'connectionRequestUpdated' subscription in the resolver.
//  * @param meta - Optional metadata, can include 'fields'.
//  * @returns A gql object.
//  */
// export const buildConnectionRequestUpdatedSubscription = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || CONNECTION_REQUEST_FIELDS;
//   return gql`
//     subscription ConnectionRequestUpdated {
//       connectionRequestUpdated {
//         ${fields}
//       }
//     }
//   `;
// };

// // =============================================================================
// // == ADMIN / MISC QUERIES & MUTATIONS
// // =============================================================================
// export const buildUpdateAccountStatusMutation = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || USER_FIELDS;
//   return gql`
//     mutation UpdateAccountStatus($updateAccountStatusInput: UpdateAccountStatusInput!) { # Argument name from resolver
//       updateAccountStatus(updateAccountStatusInput: $updateAccountStatusInput) { # 'updateAccountStatus' is the mutation name
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * @param meta - Optional metadata.
//  * @returns A gql object.
//  */
// export const buildGetUserByUidQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || USER_FIELDS;
//   return gql`
//     query GetUserByFirebaseUid($firebaseUid: ID!) { # Argument name from resolver
//       getUserByFirebaseUid(firebaseUid: $firebaseUid) { # 'updateAccountStatus' is the mutation name
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * @param meta - Optional metadata.
//  * @returns A gql object.
//  */
// export const buildCheckUserExistsByEmailQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || CHECK_USER_FIELDS;
//   return gql`
//     query CheckUserExistsByEmail($email: String!) {
//       checkUserExistsByEmail(email: $email) {
//         ${fields}
//       }
//     }
//   `;
// };

// // =============================================================================
// // == FCM TOKEN MUTATIONS
// // =============================================================================

// /**
//  * Builds a GraphQL mutation for registering an FCM token.
//  * Corresponds to 'registerFcmToken' resolver in users.resolver.ts.
//  * @returns A gql object.
//  */
// export const buildRegisterFcmTokenMutation = () => {
//   return gql`
//     mutation RegisterFcmToken($token: String!) {
//       registerFcmToken(token: $token)
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for unregistering an FCM token.
//  * Corresponds to 'unregisterFcmToken' resolver in users.resolver.ts.
//  * @returns A gql object.
//  */
// export const buildUnregisterFcmTokenMutation = () => {
//   return gql`
//     mutation UnregisterFcmToken($token: String!) {
//       unregisterFcmToken(token: $token)
//     }
//   `;
// };

// // =============================================================================
// // == POST & COMMENT QUERIES & MUTATIONS
// // =============================================================================

// /**
//  * Builds a GraphQL query for fetching a feed of posts.
//  */
// export const buildGetFeedQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || POST_FIELDS;
//   return gql`
//     query GetFeed($limit: Int, $skip: Int) {
//       getFeed(limit: $limit, skip: $skip) {
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * Builds a GraphQL query for fetching a single post by its ID.
//  */
// export const buildGetPostByIdQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || POST_FIELDS;
//   return gql`
//     query GetPostById($id: ID!) {
//       getPostById(id: $id) {
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for creating a new post.
//  */
// export const buildCreatePostMutation = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || POST_FIELDS;
//   return gql`
//     mutation CreatePost($createPostInput: CreatePostInput!) {
//       createPost(createPostInput: $createPostInput) {
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for updating an existing post.
//  */
// export const buildUpdatePostMutation = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || POST_FIELDS;
//   return gql`
//     mutation UpdatePost($postId: ID!, $updatePostInput: UpdatePostInput!) {
//       updatePost(postId: $postId, updatePostInput: $updatePostInput) {
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for removing a post.
//  */
// export const buildRemovePostMutation = () => {
//   return gql`
//     mutation RemovePost($id: ID!) {
//       removePost(id: $id)
//     }
//   `;
// };


// /**
//  * Builds a GraphQL mutation for adding a comment to a post.
//  */
// export const buildAddCommentMutation = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || COMMENT_FIELDS;
//   return gql`
//     mutation AddComment($createCommentInput: CreateCommentInput!) {
//       addComment(createCommentInput: $createCommentInput) {
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * Builds a GraphQL query for fetching comments for a specific post.
//  */
// export const buildGetCommentsByPostQuery = (meta?: { fields?: string }) => {
//   const fields = meta?.fields || COMMENT_FIELDS;
//   return gql`
//     query GetCommentsByPost($postId: ID!, $limit: Int, $skip: Int) {
//       getCommentsByPost(postId: $postId, limit: $limit, skip: $skip) {
//         ${fields}
//       }
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for removing a comment.
//  */
// export const buildRemoveCommentMutation = () => {
//   return gql`
//     mutation RemoveComment($commentId: ID!) {
//       removeComment(commentId: $commentId)
//     }
//   `;
// };


// /**
//  * Builds a GraphQL mutation for liking a post.
//  */
// export const buildLikePostMutation = () => {
//   return gql`
//     mutation LikePost($postId: ID!) {
//       likePost(postId: $postId)
//     }
//   `;
// };

// /**
//  * Builds a GraphQL mutation for unliking a post.
//  */
// export const buildUnlikePostMutation = () => {
//   return gql`
//     mutation UnlikePost($postId: ID!) {
//       unlikePost(postId: $postId)
//     }
//   `;
// };
import { gql } from "@apollo/client";

/**
 * Default fields for User. Adjust as needed.
 * This helps avoid repeating field lists everywhere.
 * Corresponds to users.model.ts User InterfaceType and its implementations.
 */
const USER_FIELDS = `
  id
  firebaseUid
  email
  slug
  userType
  profilePicUrl
  coverPicUrl
  bio
  websiteUrl
  accountStatus
  connections
  followers
  following
  blockedUsers
  fcmTokens
  language
  createdAt
  updatedAt
  lastLoginAt
  location {
    addressLine1
    addressLine2
    city
    stateOrProvince
    postalCode
    country
  }
  professionalAccreditation {
    accreditationType
    referenceNumber
    documentUrl
    issueDate
    expirationDate
    issuingAuthority
  }
  ... on IndividualUserObject { # Specific fields for IndividualUser
    firstName
    lastName
    speciality
    professionalTitle
  }
  ... on LegalEntityUserObject { # Specific fields for LegalEntityUser
    entityName
    entityType
  }
`;

const CHECK_USER_FIELDS = `
  exists
  hasPassword
  providers
  `;

// =============================================================================
// == USER QUERIES & MUTATIONS
// =============================================================================
export const buildGetAllUsersQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || USER_FIELDS;
  return gql`
    query GetAllUsers($skip: Int, $limit: Int, $userType: UserType) { # Arguments from GetAllUsersArgs
      getAllUsers(skip: $skip, limit: $limit, userType: $userType) {
        ${fields}
      }
      # For total count, your API needs to provide it. Example:
      # allUsersCount(userType: $userType)
    }
  `;
};

/**
 * Builds a GraphQL query for fetching a single user by ID.
 * Corresponds to 'user' resolver in users.resolver.ts.
 * @param meta - Optional metadata, can include 'fields'.
 * @returns A gql object.
 */
export const buildGetUserByIdQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || USER_FIELDS;
  return gql`
    query GetUserById($id: ID!) {
      getUserById(id: $id) { # 'user' is the query name
        ${fields}
      }
    }
  `;
};

export const buildGetMeQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || USER_FIELDS;
  return gql`
    query GetMe {
      me{ # 'user' is the query name
        ${fields}
      }
    }
  `;
};

export const buildGetUserBySlugQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || USER_FIELDS;
  return gql`
    query GetUserBySlug($slug: String!) {
      getUserBySlug(slug: $slug) { # 'user' is the query name
        ${fields}
      }
    }
  `;
};

/* Builds a GraphQL mutation for creating a user.
* Corresponds to 'createUser' resolver in users.resolver.ts.
* @param meta - Optional metadata.
* @returns A gql object.
*/
export const buildCreateUserMutation = (meta?: { fields?: string }) => {
 const fields = meta?.fields || USER_FIELDS;
 return gql`
   mutation CreateUser($createUserInput: CreateUserInput!) { # Argument name from resolver
     createUser(createUserInput: $createUserInput) { # 'createUser' is the mutation name
       ${fields}
     }
   }
 `;
};

/**
 * Builds a GraphQL mutation for updating the current user's profile.
 * Corresponds to 'updateMyProfile' resolver in users.resolver.ts.
 * @param meta - Optional metadata.
 * @returns A gql object.
 */
export const buildUpdateMyProfileMutation = (meta?: { fields?: string }) => {
  const fields = meta?.fields || USER_FIELDS;
  return gql`
    mutation UpdateMyProfile($updateUserInput: UpdateUserInput!) { # Argument name from resolver
      updateMyProfile(updateUserInput: $updateUserInput) { # 'updateMyProfile' is the mutation name
        ${fields}
      }
    }
  `;
};

// =============================================================================
// == FOLLOW QUERIES & MUTATIONS
// =============================================================================

/**
 * Builds a GraphQL mutation for following a user.
 * Corresponds to 'follow' resolver in users.resolver.ts.
 * @returns A gql object.
 */
export const buildFollowMutation = () => {
  return gql`
    mutation Follow($userId: ID!) {
      follow(userId: $userId)
    }
  `;
};

/**
 * Builds a GraphQL mutation for unfollowing a user.
 * Corresponds to 'unfollow' resolver in users.resolver.ts.
 * @returns A gql object.
 */
export const buildUnfollowMutation = () => {
  return gql`
    mutation Unfollow($userId: ID!) {
      unfollow(userId: $userId)
    }
  `;
};

const FOLLOWS_UPDATE_FIELDS = `
  follower {
    userId
    followersCount
  }
  following {
    userId
    followingCount
  }
`;

/**
 * Builds a GraphQL subscription to listen for updates on a user's followers/following count.
 * Corresponds to the 'followsUpdated' subscription in the resolver.
 * @param meta - Optional metadata, can include 'fields'.
 * @returns A gql object.
 */
export const buildFollowsUpdatedSubscription = (meta?: { fields?: string }) => {
  const fields = meta?.fields || FOLLOWS_UPDATE_FIELDS;
  return gql`
    subscription FollowsUpdated($userId: ID!) {
      followsUpdated(userId: $userId) {
        ${fields}
      }
    }
  `;
};

// =============================================================================
// == ADMIN / MISC QUERIES & MUTATIONS
// =============================================================================
export const buildUpdateAccountStatusMutation = (meta?: { fields?: string }) => {
  const fields = meta?.fields || USER_FIELDS;
  return gql`
    mutation UpdateAccountStatus($updateAccountStatusInput: UpdateAccountStatusInput!) { # Argument name from resolver
      updateAccountStatus(updateAccountStatusInput: $updateAccountStatusInput) { # 'updateAccountStatus' is the mutation name
        ${fields}
      }
    }
  `;
};

/**
 * @param meta - Optional metadata.
 * @returns A gql object.
 */
export const buildGetUserByUidQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || USER_FIELDS;
  return gql`
    query GetUserByFirebaseUid($firebaseUid: ID!) { # Argument name from resolver
      getUserByFirebaseUid(firebaseUid: $firebaseUid) { # 'updateAccountStatus' is the mutation name
        ${fields}
      }
    }
  `;
};

/**
 * @param meta - Optional metadata.
 * @returns A gql object.
 */
export const buildCheckUserExistsByEmailQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || CHECK_USER_FIELDS;
  return gql`
    query CheckUserExistsByEmail($email: String!) {
      checkUserExistsByEmail(email: $email) {
        ${fields}
      }
    }
  `;
};

// =============================================================================
// == FCM TOKEN MUTATIONS
// =============================================================================

/**
 * Builds a GraphQL mutation for registering an FCM token.
 * Corresponds to 'registerFcmToken' resolver in users.resolver.ts.
 * @returns A gql object.
 */
export const buildRegisterFcmTokenMutation = () => {
  return gql`
    mutation RegisterFcmToken($token: String!) {
      registerFcmToken(token: $token)
    }
  `;
};

/**
 * Builds a GraphQL mutation for unregistering an FCM token.
 * Corresponds to 'unregisterFcmToken' resolver in users.resolver.ts.
 * @returns A gql object.
 */
export const buildUnregisterFcmTokenMutation = () => {
  return gql`
    mutation UnregisterFcmToken($token: String!) {
      unregisterFcmToken(token: $token)
    }
  `;
};
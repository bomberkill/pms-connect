import { gql } from "@apollo/client";

/**
 * Default fields for User. Adjust as needed.
 * This helps avoid repeating field lists everywhere.
 * Corresponds to users.model.ts User InterfaceType and its implementations.
 */
const USER_FIELDS = `
  _id
  firebaseUid
  email
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


export const buildGetAllUsersQuery = (meta?: { fields?: string }) => {
    const fields = meta?.fields || USER_FIELDS;
    return gql`
      query AllUsers($skip: Int, $limit: Int, $userType: UserType) { # Arguments from GetAllUsersArgs
        allUsers(skip: $skip, limit: $limit, userType: $userType) {
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
        user(id: $id) { # 'user' is the query name
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

/**
 * Builds a GraphQL mutation for updating a user's account status (admin action).
 * Corresponds to 'updateAccountStatus' resolver in users.resolver.ts.
 * @param meta - Optional metadata.
 * @returns A gql object.
 */
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
 * Builds a GraphQL mutation for updating a user's account status (admin action).
 * Corresponds to 'updateAccountStatus' resolver in users.resolver.ts.
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
  
  
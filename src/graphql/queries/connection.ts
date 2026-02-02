import { gql } from "@apollo/client";

const CONNECTION_REQUEST_FIELDS = `
  id
  status
  createdAt
  updatedAt
  requester {
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
  recipient {
    id
    slug
    profilePicUrl
    ... on IndividualUserObject {
      firstName
      lastName
    }
    ... on LegalEntityUserObject {
      entityName
      entityType
    }
  }
`;

const CONNECTION_REQUEST_FOR_SUBSCRIPTION_FIELDS = `
  id
  status
  createdAt
  updatedAt
  requester
  recipient
`;

// =============================================================================
// == CONNECTION QUERIES & MUTATIONS
// =============================================================================

/**
 * Builds a GraphQL query for fetching the current user's connection requests.
 * Corresponds to 'getMyConnectionRequests' resolver in users.resolver.ts.
 * @param meta - Optional metadata, can include 'fields'.
 * @returns A gql object.
 */
export const buildGetMyConnectionRequestsQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || CONNECTION_REQUEST_FIELDS;
  return gql`
    query GetMyConnectionRequests($status: ConnectionRequestStatusGQL) {
      getMyConnectionRequests(status: $status) {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL mutation for sending a connection request.
 * Corresponds to 'sendConnectionRequest' resolver in users.resolver.ts.
 * @returns A gql object.
 */
export const buildSendConnectionRequestMutation = () => {
  return gql`
    mutation SendConnectionRequest($recipientId: ID!) {
      sendConnectionRequest(recipientId: $recipientId)
    }
  `;
};

/**
 * Builds a GraphQL mutation for accepting a connection request.
 * Corresponds to 'acceptConnectionRequest' resolver in users.resolver.ts.
 * @returns A gql object.
 */
export const buildAcceptConnectionRequestMutation = () => {
  return gql`
    mutation AcceptConnectionRequest($requestId: ID!) {
      acceptConnectionRequest(requestId: $requestId)
    }
  `;
};

/**
 * Builds a GraphQL mutation for declining or canceling a connection request.
 * Corresponds to 'declineOrCancelConnectionRequest' resolver in users.resolver.ts.
 * @returns A gql object.
 */
export const buildDeclineOrCancelConnectionRequestMutation = () => {
  return gql`
    mutation DeclineOrCancelConnectionRequest($requestId: ID!) {
      declineOrCancelConnectionRequest(requestId: $requestId)
    }
  `;
};

/**
 * Builds a GraphQL mutation for removing a connection.
 * Corresponds to 'removeConnection' resolver in users.resolver.ts.
 * @returns A gql object.
 */
export const buildRemoveConnectionMutation = () => {
  return gql`
    mutation RemoveConnection($userIdB: ID!) {
      removeConnection(userIdB: $userIdB)
    }
  `;
};

/**
 * Builds a GraphQL subscription to listen for updates on connection requests.
 * Corresponds to the 'connectionRequestUpdated' subscription in the resolver.
 * @param meta - Optional metadata, can include 'fields'.
 * @returns A gql object.
 */
export const buildConnectionRequestUpdatedSubscription = (meta?: { fields?: string }) => {
  const fields = meta?.fields || CONNECTION_REQUEST_FOR_SUBSCRIPTION_FIELDS;
  return gql`
    subscription ConnectionRequestUpdated {
      connectionRequestUpdated {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL query for fetching a user's connections.
 * Corresponds to 'getConnections' resolver in connection-requests.resolver.ts.
 * @returns A gql object.
 */
export const buildGetConnectionsQuery = () => {
  return gql`
    query GetConnections($userId: ID!) {
      getConnections(userId: $userId) {
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
    }
  `;
};
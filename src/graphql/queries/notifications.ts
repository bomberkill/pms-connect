import { gql } from "@apollo/client";

const NOTIFICATION_FIELDS = `
  id
  message
  read
  createdAt
  type
  entityId
  sender {
    id
    profilePicUrl
    userType
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
`;

/**
 * Builds a GraphQL query for fetching the current user's notifications.
 * Corresponds to 'getMyNotifications' resolver in notifications.resolver.ts.
 * @param meta - Optional metadata, can include 'fields'.
 * @returns A gql object.
 */
export const buildGetMyNotificationsQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || NOTIFICATION_FIELDS;
  return gql`
    query GetMyNotifications($skip: Int, $limit: Int) {
      getMyNotifications(skip: $skip, limit: $limit) {
        ${fields}
      }
    }
  `;
};

/**
 * Builds a GraphQL mutation for marking notifications as read.
 * Corresponds to 'markNotificationsAsRead' resolver in notifications.resolver.ts.
 * @returns A gql object.
 */
export const buildMarkNotificationsAsReadMutation = () => {
  return gql`
    mutation MarkNotificationsAsRead($notificationIds: [ID!]!) {
      markNotificationsAsRead(notificationIds: $notificationIds)
    }
  `;
};

/**
 * Builds a GraphQL subscription for notification updates.
 * Corresponds to 'notificationAdded' subscription in notifications.resolver.ts.
 * @param meta - Optional metadata, can include 'fields'.
 * @returns A gql object.
 */
export const buildNotificationAddedSubscription = (meta?: { fields?: string }) => {
  const fields = meta?.fields || NOTIFICATION_FIELDS;
  return gql`
    subscription NotificationAdded {
      notificationAdded {
        ${fields}
      }
    }
  `;
};
/**
 * Builds a GraphQL query for fetching the unread notifications count.
 * @returns A gql object.
 */
export const buildUnreadNotificationsCountQuery = () => {
  return gql`
    query UnreadNotificationsCount {
      unreadNotificationsCount
    }
  `;
};

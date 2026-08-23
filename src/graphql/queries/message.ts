import { gql } from "@apollo/client";

const MESSAGE_AUTHOR_FIELDS = `
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
`;

export const MESSAGE_FIELDS = `
  id
  conversationId
  content
  read
  deleted
  createdAt
  updatedAt
  sender {
    ${MESSAGE_AUTHOR_FIELDS}
  }
`;

export const CONVERSATION_FIELDS = `
  id
  createdAt
  lastMessageAt
  unreadCount
  otherParticipant {
    ${MESSAGE_AUTHOR_FIELDS}
  }
  lastMessage {
    ${MESSAGE_FIELDS}
  }
`;

export const buildGetMyConversationsQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || CONVERSATION_FIELDS;
  return gql`
    query GetMyConversations($limit: Int, $skip: Int) {
      getMyConversations(limit: $limit, skip: $skip) {
        ${fields}
      }
    }
  `;
};

export const buildGetConversationByIdQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || CONVERSATION_FIELDS;
  return gql`
    query GetConversationById($conversationId: ID!) {
      getConversationById(conversationId: $conversationId) {
        ${fields}
      }
    }
  `;
};

export const buildGetMessagesQuery = (meta?: { fields?: string }) => {
  const fields = meta?.fields || MESSAGE_FIELDS;
  return gql`
    query GetMessages($conversationId: ID!, $limit: Int, $skip: Int) {
      getMessages(conversationId: $conversationId, limit: $limit, skip: $skip) {
        ${fields}
      }
    }
  `;
};

export const buildGetUnreadConversationsCountQuery = () => {
  return gql`
    query GetUnreadConversationsCount {
      getUnreadConversationsCount
    }
  `;
};

export const buildGetOrCreateConversationWithUserMutation = (meta?: { fields?: string }) => {
  const fields = meta?.fields || CONVERSATION_FIELDS;
  return gql`
    mutation GetOrCreateConversationWithUser($userId: ID!) {
      getOrCreateConversationWithUser(userId: $userId) {
        ${fields}
      }
    }
  `;
};

export const buildSendMessageMutation = (meta?: { fields?: string }) => {
  const fields = meta?.fields || MESSAGE_FIELDS;
  return gql`
    mutation SendMessage($recipientId: ID!, $content: String!) {
      sendMessage(recipientId: $recipientId, content: $content) {
        ${fields}
      }
    }
  `;
};

export const buildEditMessageMutation = (meta?: { fields?: string }) => {
  const fields = meta?.fields || MESSAGE_FIELDS;
  return gql`
    mutation EditMessage($messageId: ID!, $content: String!) {
      editMessage(messageId: $messageId, content: $content) {
        ${fields}
      }
    }
  `;
};

export const buildDeleteMessageMutation = () => {
  return gql`
    mutation DeleteMessage($messageId: ID!) {
      deleteMessage(messageId: $messageId)
    }
  `;
};

export const buildMarkConversationReadMutation = () => {
  return gql`
    mutation MarkConversationRead($conversationId: ID!) {
      markConversationRead(conversationId: $conversationId)
    }
  `;
};

export const buildSetActiveConversationMutation = () => {
  return gql`
    mutation SetActiveConversation($conversationId: ID!) {
      setActiveConversation(conversationId: $conversationId)
    }
  `;
};

export const buildClearActiveConversationMutation = () => {
  return gql`
    mutation ClearActiveConversation {
      clearActiveConversation
    }
  `;
};

export const buildSendTypingIndicatorMutation = () => {
  return gql`
    mutation SendTypingIndicator($conversationId: ID!) {
      sendTypingIndicator(conversationId: $conversationId)
    }
  `;
};

export const buildMessageAddedSubscription = (meta?: { fields?: string }) => {
  const fields = meta?.fields || MESSAGE_FIELDS;
  return gql`
    subscription MessageAdded($conversationId: ID!) {
      messageAdded(conversationId: $conversationId) {
        ${fields}
      }
    }
  `;
};

export const buildMessageEditedSubscription = (meta?: { fields?: string }) => {
  const fields = meta?.fields || MESSAGE_FIELDS;
  return gql`
    subscription MessageEdited($conversationId: ID!) {
      messageEdited(conversationId: $conversationId) {
        ${fields}
      }
    }
  `;
};

export const buildMessageDeletedSubscription = () => {
  return gql`
    subscription MessageDeleted($conversationId: ID!) {
      messageDeleted(conversationId: $conversationId)
    }
  `;
};

export const buildConversationPresenceSubscription = () => {
  return gql`
    subscription ConversationPresence($conversationId: ID!) {
      conversationPresence(conversationId: $conversationId) {
        online
        typing
      }
    }
  `;
};

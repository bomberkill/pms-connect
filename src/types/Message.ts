import { User } from './User';

/**
 * Represents a Message object, mirroring the GraphQL schema.
 */
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  read: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  sender: User;
}

/**
 * Represents a Conversation object, mirroring the GraphQL schema.
 */
export interface Conversation {
  id: string;
  createdAt: string;
  lastMessageAt?: string | null;
  unreadCount: number;
  otherParticipant: User;
  lastMessage?: Message | null;
}

export interface ConversationPresence {
  online: boolean;
  typing: boolean;
}

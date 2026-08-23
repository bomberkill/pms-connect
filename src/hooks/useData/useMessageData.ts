import { useQuery, useMutation, useSubscription, gql, Reference } from '@apollo/client';
import {
  buildGetMyConversationsQuery,
  buildGetConversationByIdQuery,
  buildGetMessagesQuery,
  buildGetUnreadConversationsCountQuery,
  buildGetOrCreateConversationWithUserMutation,
  buildSendMessageMutation,
  buildEditMessageMutation,
  buildDeleteMessageMutation,
  buildMarkConversationReadMutation,
  buildSetActiveConversationMutation,
  buildClearActiveConversationMutation,
  buildSendTypingIndicatorMutation,
  buildMessageAddedSubscription,
  buildMessageEditedSubscription,
  buildMessageDeletedSubscription,
  buildConversationPresenceSubscription,
  buildNotificationAddedSubscription,
  MESSAGE_FIELDS,
} from '@/graphql/queries/index';
import { Conversation, Message, ConversationPresence } from '@/types/Message';
import { useMe } from './useUserData';
import { useEffect, useRef } from 'react';

// =============================================================================
// == CONVERSATIONS
// =============================================================================

export const useConversations = (options: { limit?: number } = {}) => {
  const { limit = 20 } = options;
  const { data, loading, error, fetchMore, refetch } = useQuery<{ getMyConversations: Conversation[] }>(
    buildGetMyConversationsQuery(),
    {
      variables: { skip: 0, limit },
      fetchPolicy: 'cache-and-network',
    }
  );

  const conversations: Conversation[] = data?.getMyConversations || [];

  return {
    conversations,
    loading,
    error,
    refetch,
    loadMore: () => fetchMore({
      variables: { skip: conversations.length },
    }),
  };
};

export const useConversation = (conversationId: string) => {
  const safeId = conversationId?.trim();
  const { data, loading, error } = useQuery<{ getConversationById: Conversation }>(
    buildGetConversationByIdQuery(),
    {
      variables: safeId ? { conversationId: safeId } : undefined,
      fetchPolicy: 'cache-first',
      skip: !safeId,
    }
  );

  return { conversation: data?.getConversationById, loading, error };
};

export const useGetOrCreateConversationWithUser = () => {
  const [getOrCreateConversationWithUser, { loading, error }] = useMutation<
    { getOrCreateConversationWithUser: Conversation }, { userId: string }
  >(buildGetOrCreateConversationWithUserMutation());

  return { getOrCreateConversationWithUser, loading, error };
};

/**
 * Hook to fetch and track the count of conversations that have at least one
 * unread message. There's no dedicated "any new message across all
 * conversations" subscription — messageAdded is deliberately scoped per
 * conversationId (mirrors commentAdded(postId)), so it can't drive a
 * cross-conversation badge on its own. Every message that isn't suppressed
 * by "recipient is actively viewing this thread" already creates a MESSAGE
 * notification server-side (see PresenceService.getActiveConversation in
 * MessagesService.sendMessage), so filtering the existing global
 * notificationAdded stream for MESSAGE events is the right signal here,
 * with no new subscription needed.
 */
export const useUnreadConversationsCount = () => {
  const { data, loading, error, subscribeToMore } = useQuery<{ getUnreadConversationsCount: number }>(
    buildGetUnreadConversationsCountQuery(),
    { fetchPolicy: 'cache-first' }
  );

  return {
    unreadCount: data?.getUnreadConversationsCount || 0,
    loading,
    error,
    subscribeToNewMessages: () => {
      return subscribeToMore<{ notificationAdded: { type?: string } }>({
        document: buildNotificationAddedSubscription(),
        updateQuery: (prev, { subscriptionData }) => {
          const notification = subscriptionData.data?.notificationAdded;
          if (!notification || notification.type !== 'MESSAGE') return prev;
          return {
            ...prev,
            getUnreadConversationsCount: (prev.getUnreadConversationsCount || 0) + 1,
          };
        },
      });
    },
  };
};

// =============================================================================
// == MESSAGES
// =============================================================================

/**
 * Fetches a conversation's messages and keeps them live via the
 * messageAdded/messageEdited/messageDeleted subscriptions. New messages are
 * merged straight into the getMessages cache field (same cache.modify
 * pattern as useCommentActions' addComment), edits/deletes update the
 * normalized Message:id entity directly — no need to touch the list array
 * for those two, since Apollo already normalizes Message by id.
 */
export const useConversationMessages = (conversationId: string, options: { limit?: number } = {}) => {
  const { limit = 30 } = options;
  const safeId = conversationId?.trim();

  const { data, loading, error, fetchMore, refetch } = useQuery<{ getMessages: Message[] }>(
    buildGetMessagesQuery(),
    {
      variables: safeId ? { conversationId: safeId, limit, skip: 0 } : undefined,
      fetchPolicy: 'cache-and-network',
      skip: !safeId,
    }
  );

  const messages: Message[] = data?.getMessages || [];

  useSubscription<{ messageAdded: Message }>(buildMessageAddedSubscription(), {
    variables: { conversationId: safeId },
    skip: !safeId,
    onData: ({ client, data: subData }) => {
      const newMessage = subData.data?.messageAdded;
      if (!newMessage) return;
      client.cache.modify({
        fields: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getMessages(value: readonly any[] | Reference = [], { storeFieldName }) {
            const existing = Array.isArray(value) ? value : [];
            if (!storeFieldName.includes(safeId)) return existing;
            const newMessageId = client.cache.identify({ __typename: 'Message', id: newMessage.id });
            const alreadyPresent = existing.some((ref) => client.cache.identify(ref) === newMessageId);
            if (alreadyPresent) return existing;
            const ref = client.cache.writeFragment({
              data: newMessage,
              fragment: gql`
                fragment NewMessage on Message {
                  ${MESSAGE_FIELDS}
                }
              `,
            });
            return [ref, ...existing];
          },
        },
      });
    },
  });

  useSubscription<{ messageEdited: Message }>(buildMessageEditedSubscription(), {
    variables: { conversationId: safeId },
    skip: !safeId,
    onData: ({ client, data: subData }) => {
      const edited = subData.data?.messageEdited;
      if (!edited) return;
      client.cache.modify({
        id: client.cache.identify({ __typename: 'Message', id: edited.id }),
        fields: {
          content: () => edited.content,
          updatedAt: () => edited.updatedAt,
        },
      });
    },
  });

  useSubscription<{ messageDeleted: string }>(buildMessageDeletedSubscription(), {
    variables: { conversationId: safeId },
    skip: !safeId,
    onData: ({ client, data: subData }) => {
      const deletedId = subData.data?.messageDeleted;
      if (!deletedId) return;
      client.cache.modify({
        id: client.cache.identify({ __typename: 'Message', id: deletedId }),
        fields: {
          deleted: () => true,
        },
      });
    },
  });

  return {
    messages,
    loading,
    error,
    loadMore: () => fetchMore({ variables: { skip: messages.length } }),
    refetch,
  };
};

export const useSendMessage = (conversationId: string) => {
  const { me } = useMe();
  const [sendMessage, { loading: sending, error: sendError }] = useMutation<
    { sendMessage: Message }, { recipientId: string; content: string }
  >(buildSendMessageMutation(), {
    optimisticResponse: (variables) => {
      if (!me) return undefined as unknown as { sendMessage: Message };
      return {
        sendMessage: {
          __typename: 'Message',
          id: `temp-${Date.now()}`,
          conversationId,
          content: variables.content,
          read: false,
          deleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sender: me,
        } as Message,
      };
    },
    update(cache, { data }) {
      if (!data?.sendMessage) return;
      const message = data.sendMessage;

      cache.modify({
        fields: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getMessages(value: readonly any[] | Reference = [], { storeFieldName }) {
            const existing = Array.isArray(value) ? value : [];
            if (!storeFieldName.includes(message.conversationId)) return existing;
            const messageId = cache.identify({ __typename: 'Message', id: message.id });
            const alreadyPresent = existing.some((ref) => cache.identify(ref) === messageId);
            if (alreadyPresent) return existing;
            const ref = cache.writeFragment({
              data: message,
              fragment: gql`
                fragment NewSentMessage on Message {
                  ${MESSAGE_FIELDS}
                }
              `,
            });
            return [ref, ...existing];
          },
        },
      });

      cache.modify({
        id: cache.identify({ __typename: 'Conversation', id: message.conversationId }),
        fields: {
          lastMessage: () => cache.writeFragment({
            data: message,
            fragment: gql`
              fragment LastSentMessage on Message {
                ${MESSAGE_FIELDS}
              }
            `,
          }),
          lastMessageAt: () => message.createdAt,
        },
      });
    },
  });

  return { sendMessage, sending, sendError };
};

export const useEditMessage = () => {
  const [editMessage, { loading: editing, error: editError }] = useMutation<
    { editMessage: Message }, { messageId: string; content: string }
  >(buildEditMessageMutation(), {
    update(cache, { data }) {
      if (!data?.editMessage) return;
      cache.modify({
        id: cache.identify({ __typename: 'Message', id: data.editMessage.id }),
        fields: {
          content: () => data.editMessage.content,
          updatedAt: () => data.editMessage.updatedAt,
        },
      });
    },
  });

  return { editMessage, editing, editError };
};

export const useDeleteMessage = () => {
  const [deleteMessage, { loading: deleting, error: deleteError }] = useMutation<
    { deleteMessage: boolean }, { messageId: string }
  >(buildDeleteMessageMutation(), {
    optimisticResponse: { deleteMessage: true },
    update(cache, { data }, { variables }) {
      if (data?.deleteMessage && variables?.messageId) {
        cache.modify({
          id: cache.identify({ __typename: 'Message', id: variables.messageId }),
          fields: { deleted: () => true },
        });
      }
    },
  });

  return { deleteMessage, deleting, deleteError };
};

export const useMarkConversationRead = () => {
  const [markConversationRead, { loading: marking, error: markError }] = useMutation<
    { markConversationRead: boolean }, { conversationId: string }
  >(buildMarkConversationReadMutation(), {
    optimisticResponse: { markConversationRead: true },
    update(cache, { data }, { variables }) {
      if (!data?.markConversationRead || !variables?.conversationId) return;

      const convRef = cache.identify({ __typename: 'Conversation', id: variables.conversationId });
      const cached = convRef
        ? cache.readFragment<{ unreadCount: number }>({
          id: convRef,
          fragment: gql`
            fragment ConvUnreadBeforeRead on Conversation {
              unreadCount
            }
          `,
        })
        : null;
      const hadUnread = (cached?.unreadCount ?? 0) > 0;

      cache.modify({
        id: convRef,
        fields: { unreadCount: () => 0 },
      });

      if (hadUnread) {
        cache.modify({
          fields: {
            getUnreadConversationsCount(existing = 0) {
              return Math.max(0, existing - 1);
            },
          },
        });
      }
    },
  });

  return { markConversationRead, marking, markError };
};

// =============================================================================
// == PRESENCE & TYPING
// =============================================================================

export const useConversationPresence = (conversationId: string): ConversationPresence => {
  const safeId = conversationId?.trim();
  const { data } = useSubscription<{ conversationPresence: ConversationPresence }>(
    buildConversationPresenceSubscription(),
    { variables: { conversationId: safeId }, skip: !safeId }
  );

  return data?.conversationPresence ?? { online: false, typing: false };
};

const TYPING_DEBOUNCE_MS = 1500;

export const useTypingIndicator = (conversationId: string) => {
  const [sendTypingIndicatorMutation] = useMutation<{ sendTypingIndicator: boolean }, { conversationId: string }>(
    buildSendTypingIndicatorMutation()
  );
  const lastSentAtRef = useRef(0);

  const notifyTyping = () => {
    const now = Date.now();
    if (now - lastSentAtRef.current < TYPING_DEBOUNCE_MS) return;
    lastSentAtRef.current = now;
    sendTypingIndicatorMutation({ variables: { conversationId } }).catch(() => {});
  };

  return { notifyTyping };
};

/**
 * Marks this conversation as the one the user is actively looking at, for
 * as long as this hook stays mounted — MessagesService uses this
 * server-side to skip a redundant push notification for messages received
 * while the thread is already open live.
 */
export const useSetActiveConversation = (conversationId: string) => {
  const [setActiveConversationMutation] = useMutation<{ setActiveConversation: boolean }, { conversationId: string }>(
    buildSetActiveConversationMutation()
  );
  const [clearActiveConversationMutation] = useMutation<{ clearActiveConversation: boolean }>(
    buildClearActiveConversationMutation()
  );

  useEffect(() => {
    const safeId = conversationId?.trim();
    if (!safeId) return;
    setActiveConversationMutation({ variables: { conversationId: safeId } }).catch(() => {});
    return () => {
      clearActiveConversationMutation().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);
};

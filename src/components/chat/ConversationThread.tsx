"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MoreVertical, Pencil, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow, type Locale } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import {
  useConversation,
  useConversationMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useMarkConversationRead,
  useConversationPresence,
  useTypingIndicator,
  useSetActiveConversation,
  useMe,
} from "@/hooks/useData/index";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { UserTypeGQL } from "@/types/User";
import { Message } from "@/types/Message";
import { cn } from "@/lib/utils";

interface ConversationThreadProps {
  conversationId: string;
}

function MessageBubble({
  message,
  isOwn,
  dict,
  dateLocale,
  onEdit,
  onDelete,
}: {
  message: Message;
  isOwn: boolean;
  dict: ReturnType<typeof useDictionary>;
  dateLocale: Locale;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
}) {
  const isEdited = message.updatedAt !== message.createdAt;

  return (
    <div className={cn("flex items-end gap-2 group", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 text-sm leading-relaxed",
          isOwn
            ? "bg-primary text-primary-foreground rounded-[14px_4px_14px_14px]"
            : "bg-muted text-foreground rounded-[4px_14px_14px_14px]"
        )}
      >
        {message.deleted ? (
          <p className="italic opacity-70">{dict.chat.messageDeleted}</p>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <div className={cn("flex items-center gap-1.5 mt-1", isOwn ? "justify-end" : "justify-start")}>
          {isEdited && !message.deleted && (
            <span className={cn("text-2xs", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
              {dict.post.edited}
            </span>
          )}
          <span className={cn("text-2xs", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: dateLocale })}
          </span>
        </div>
      </div>

      {isOwn && !message.deleted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={dict.common.actions}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted shrink-0"
            >
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(message)}>
              <Pencil className="mr-2 h-4 w-4" /> {dict.actions.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onDelete(message.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> {dict.actions.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default function ConversationThread({ conversationId }: ConversationThreadProps) {
  const dict = useDictionary();
  const router = useRouter();
  const dateLocale = typeof window !== "undefined" && window.location.pathname.startsWith("/fr") ? fr : enUS;
  const { me } = useMe();

  const { conversation, loading: loadingConversation } = useConversation(conversationId);
  const { messages, loading: loadingMessages, loadMore } = useConversationMessages(conversationId);
  const { sendMessage, sending } = useSendMessage(conversationId);
  const { editMessage } = useEditMessage();
  const { deleteMessage } = useDeleteMessage();
  const { markConversationRead } = useMarkConversationRead();
  const presence = useConversationPresence(conversationId);
  const { notifyTyping } = useTypingIndicator(conversationId);
  useSetActiveConversation(conversationId);

  const [content, setContent] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMarkedReadRef = useRef(false);

  useEffect(() => {
    if (!hasMarkedReadRef.current && conversation) {
      hasMarkedReadRef.current = true;
      markConversationRead({ variables: { conversationId } }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const orderedMessages = [...messages].reverse();

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || !conversation?.otherParticipant?.id) return;
    setContent("");
    try {
      await sendMessage({ variables: { recipientId: conversation.otherParticipant.id, content: trimmed } });
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const handleEditStart = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleEditSave = async () => {
    const trimmed = editingContent.trim();
    if (!editingMessageId || !trimmed) return;
    try {
      await editMessage({ variables: { messageId: editingMessageId, content: trimmed } });
      setEditingMessageId(null);
    } catch (e) {
      console.error("Failed to edit message", e);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage({ variables: { messageId } });
    } catch (e) {
      console.error("Failed to delete message", e);
    }
  };

  if (loadingConversation && !conversation) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-2rem)] max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <button type="button" aria-label={dict.actions.back} onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar
          shape={conversation.otherParticipant.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"}
          className="h-9 w-9 shrink-0"
        >
          <AvatarImage className="object-cover" src={conversation.otherParticipant.profilePicUrl} />
          <AvatarFallback>{getUserInitials(conversation.otherParticipant)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] truncate">{getUserDisplayName(conversation.otherParticipant)}</p>
          {presence.typing ? (
            <p className="text-xs text-primary">{dict.chat.typing}</p>
          ) : presence.online ? (
            <p className="text-xs text-secondary-600 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-600" /> {dict.chat.online}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length > 0 && messages.length % 30 === 0 && !loadingMessages && (
          <div className="flex justify-center pb-2">
            <Button variant="ghost" size="sm" onClick={() => loadMore()}>{dict.actions.loadMore}</Button>
          </div>
        )}

        {orderedMessages.length === 0 && !loadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-16">
            <p>{dict.chat.noMessagesYet}</p>
          </div>
        ) : (
          orderedMessages.map((message) =>
            editingMessageId === message.id ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[75%] w-full space-y-2">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="min-h-16 text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingMessageId(null)}>{dict.common.cancel}</Button>
                    <Button size="sm" onClick={handleEditSave}>{dict.button.save}</Button>
                  </div>
                </div>
              </div>
            ) : (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender.id === me?.id}
                dict={dict}
                dateLocale={dateLocale}
                onEdit={handleEditStart}
                onDelete={handleDelete}
              />
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 bg-background sticky bottom-0">
        <div className="flex items-end gap-2">
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={dict.chat.composerPlaceholder}
            className="min-h-11 max-h-32 py-2.5"
          />
          <Button
            size="icon"
            className="rounded-full shrink-0"
            onClick={handleSend}
            disabled={sending || !content.trim()}
            aria-label={dict.chat.send}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

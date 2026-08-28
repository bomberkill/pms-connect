"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow, isSameDay, type Locale } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import {
  ArrowLeft,
  BellOff,
  Camera,
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  MoreVertical,
  Paperclip,
  Pencil,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Trash2,
  Video,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ResponsiveActionMenu, ResponsiveActionMenuItem } from "@/components/ui/responsive-action-menu";
import { Textarea } from "@/components/ui/textarea";
import { useDictionary } from "@/hooks/use-dictionary";
import {
  useConversation,
  useConversationMessages,
  useConversationPresence,
  useDeleteMessage,
  useEditMessage,
  useMarkConversationRead,
  useMe,
  useSendMessage,
  useSetActiveConversation,
  useTypingIndicator,
} from "@/hooks/useData/index";
import { cn } from "@/lib/utils";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { Message } from "@/types/Message";
import { UserTypeGQL } from "@/types/User";

interface ConversationThreadProps {
  conversationId: string;
}

type TimelineItem =
  | { type: "date"; id: string; label: string }
  | { type: "message"; id: string; message: Message };

function buildTimeline(messages: Message[], dateLocale: Locale): TimelineItem[] {
  const items: TimelineItem[] = [];
  let previous: Date | null = null;

  messages.forEach((message) => {
    const createdAt = new Date(message.createdAt);
    if (!previous || !isSameDay(previous, createdAt)) {
      items.push({
        type: "date",
        id: `date-${message.createdAt}`,
        label: format(createdAt, "d MMMM yyyy", { locale: dateLocale }),
      });
    }
    items.push({ type: "message", id: message.id, message });
    previous = createdAt;
  });

  return items;
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
  const actionItems: ResponsiveActionMenuItem[] = [
    {
      key: "edit",
      label: dict.actions.edit,
      icon: Pencil,
      onSelect: () => onEdit(message),
    },
    {
      key: "delete",
      label: dict.actions.delete,
      icon: Trash2,
      destructive: true,
      onSelect: () => onDelete(message.id),
    },
  ];

  return (
    <div className={cn("group flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && <div className="mb-2 size-5 shrink-0 rounded-full bg-secondary/15" />}
      <div
        className={cn(
          "relative max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm md:max-w-[72%]",
          isOwn
            ? "rounded-[18px_6px_18px_18px] bg-primary text-primary-foreground shadow-primary/10"
            : "rounded-[6px_18px_18px_18px] border border-border/70 bg-card text-foreground"
        )}
      >
        {message.deleted ? (
          <p className="italic opacity-70">{dict.chat.messageDeleted}</p>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <div className={cn("mt-1 flex items-center gap-1.5", isOwn ? "justify-end" : "justify-start")}>
          {isEdited && !message.deleted && (
            <span className={cn("text-2xs", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
              {dict.post.edited}
            </span>
          )}
          <span className={cn("text-2xs", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: dateLocale })}
          </span>
          {isOwn && !message.deleted && <Check className="size-3 text-primary-foreground/75" />}
        </div>
      </div>

      {isOwn && !message.deleted && (
        <ResponsiveActionMenu
          title={dict.common.actions}
          items={actionItems}
          trigger={
            <button
              type="button"
              aria-label={dict.common.actions}
              className="shrink-0 rounded-full p-1 opacity-0 transition-opacity hover:bg-muted focus:opacity-100 group-hover:opacity-100"
            >
              <MoreVertical className="size-3.5 text-muted-foreground" />
            </button>
          }
        />
      )}
    </div>
  );
}

export default function ConversationThread({ conversationId }: ConversationThreadProps) {
  const dict = useDictionary();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const dateLocale = params?.lang === "fr" ? fr : enUS;
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

  const showUnavailable = () => {
    toast.info(dict.chat.featureUnavailable);
  };

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
  const timeline = buildTimeline(orderedMessages, dateLocale);

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
      <div className="mx-auto flex min-h-[70svh] max-w-2xl items-center justify-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-2xl flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--primary-100),transparent_34%),linear-gradient(180deg,var(--background),var(--muted))] dark:bg-[radial-gradient(circle_at_top_left,var(--primary-950),transparent_34%),linear-gradient(180deg,var(--background),var(--muted))] md:h-[calc(100vh-2rem)] md:rounded-sheet md:border md:border-border">
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/95 px-3 pb-3 pt-[calc(10px+env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button type="button" aria-label={dict.actions.back} onClick={() => router.back()} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-muted">
            <ArrowLeft className="size-5" />
          </button>
          <Avatar
            shape={conversation.otherParticipant.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"}
            className="size-10 shrink-0"
          >
            <AvatarImage className="object-cover" src={conversation.otherParticipant.profilePicUrl} />
            <AvatarFallback>{getUserInitials(conversation.otherParticipant)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-black tracking-[-0.01em]">{getUserDisplayName(conversation.otherParticipant)}</p>
            {presence.typing ? (
              <p className="text-xs font-semibold text-primary">{dict.chat.typing}</p>
            ) : presence.online ? (
              <p className="flex items-center gap-1 text-xs font-semibold text-secondary-600">
                <span className="size-1.5 rounded-full bg-secondary-600" /> {dict.chat.online}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{dict.chat.encryptedHint}</p>
            )}
          </div>
          <button type="button" aria-label={dict.chat.call} onClick={showUnavailable} className="grid size-10 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/10">
            <Phone className="size-[18px]" />
          </button>
          <button type="button" aria-label={dict.chat.videoCall} onClick={showUnavailable} className="grid size-10 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/10">
            <Video className="size-[18px]" />
          </button>
          <ResponsiveActionMenu
            title={dict.common.actions}
            items={[
              { key: "search", label: dict.chat.searchInConversation, icon: Search, onSelect: showUnavailable },
              { key: "mute", label: dict.chat.muteConversation, icon: BellOff, onSelect: showUnavailable },
              { key: "media", label: dict.chat.sharedMedia, icon: ImageIcon, onSelect: showUnavailable },
            ]}
            trigger={
              <button type="button" aria-label={dict.common.actions} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-muted">
                <MoreVertical className="size-5" />
              </button>
            }
          />
        </div>
        <button
          type="button"
          onClick={showUnavailable}
          className="mt-3 flex w-full items-center gap-2 rounded-full bg-primary/8 px-3 py-2 text-left text-xs font-semibold text-primary ring-1 ring-primary/10"
        >
          <ShieldCheck className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{dict.chat.textOnlyNotice}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {messages.length > 0 && messages.length % 30 === 0 && !loadingMessages && (
          <div className="flex justify-center pb-3">
            <Button variant="ghost" size="sm" onClick={() => loadMore()}>{dict.actions.loadMore}</Button>
          </div>
        )}

        {orderedMessages.length === 0 && !loadingMessages ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="size-7" />
            </div>
            <p className="mt-4 font-heading text-xl font-black tracking-[-0.03em]">{dict.chat.noMessagesYet}</p>
            <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">{dict.chat.emptyThreadDescription}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((item) =>
              item.type === "date" ? (
                <div key={item.id} className="flex justify-center py-1">
                  <span className="rounded-full border border-border/70 bg-background/85 px-3 py-1 text-2xs font-black uppercase tracking-[0.12em] text-muted-foreground shadow-sm">
                    {item.label}
                  </span>
                </div>
              ) : editingMessageId === item.message.id ? (
                <div key={item.id} className="flex justify-end">
                  <div className="w-full max-w-[82%] space-y-2 rounded-card border border-primary/20 bg-background p-3 shadow-sm">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-20 border-0 bg-muted/60 text-sm shadow-inner"
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
                  key={item.id}
                  message={item.message}
                  isOwn={item.message.sender.id === me?.id}
                  dict={dict}
                  dateLocale={dateLocale}
                  onEdit={handleEditStart}
                  onDelete={handleDelete}
                />
              )
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/70 bg-background/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="flex items-end gap-2 rounded-[1.4rem] border border-border bg-card p-1.5 shadow-lg shadow-foreground/5">
          <ResponsiveActionMenu
            title={dict.chat.attachments}
            align="start"
            items={[
              { key: "photo", label: dict.chat.attachPhoto, icon: ImageIcon, onSelect: showUnavailable },
              { key: "camera", label: dict.chat.openCamera, icon: Camera, onSelect: showUnavailable },
              { key: "document", label: dict.chat.attachDocument, icon: FileText, onSelect: showUnavailable },
            ]}
            trigger={
              <button type="button" aria-label={dict.chat.attachments} className="grid size-10 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/10">
                <Paperclip className="size-5" />
              </button>
            }
          />
          <div className="flex min-w-0 flex-1 items-end gap-1 rounded-[1.1rem] bg-muted/55 px-1">
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
              className="max-h-32 min-h-10 resize-none border-0 bg-transparent px-2 py-2.5 text-[15px] shadow-none focus:ring-0"
            />
            <button type="button" aria-label={dict.chat.emoji} onClick={showUnavailable} className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-background">
              <Smile className="size-5" />
            </button>
          </div>
          {content.trim() ? (
            <Button
              size="icon"
              className="size-10 rounded-full shadow-md shadow-primary/20"
              onClick={handleSend}
              disabled={sending || !content.trim()}
              aria-label={dict.chat.send}
            >
              <Send className="size-4" />
            </Button>
          ) : (
            <button
              type="button"
              aria-label={dict.chat.voiceMessage}
              onClick={showUnavailable}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20"
            >
              <Mic className="size-[18px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

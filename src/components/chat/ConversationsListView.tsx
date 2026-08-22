"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useConversations } from "@/hooks/useData/index";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { UserTypeGQL } from "@/types/User";
import { cn } from "@/lib/utils";

export default function ConversationsListView() {
  const dict = useDictionary();
  const router = useRouter();
  const dateLocale = typeof window !== "undefined" && window.location.pathname.startsWith("/fr") ? fr : enUS;
  const { conversations, loading, loadMore } = useConversations();

  if (loading && conversations.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title={dict.chat.noConversationsTitle}
        description={dict.chat.noConversationsDescription}
        className="min-h-[50vh] border-0"
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="px-4 py-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
        <h1 className="text-xl font-bold font-manrope">{dict.chat.title}</h1>
      </div>

      <div className="px-2 md:px-0">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => router.push(`/chat/${conversation.id}`)}
            className="w-full flex items-center gap-3 p-3 my-1 rounded-xl text-left hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Avatar
              shape={conversation.otherParticipant.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"}
              className="h-12 w-12 shrink-0"
            >
              <AvatarImage className="object-cover" src={conversation.otherParticipant.profilePicUrl} />
              <AvatarFallback>{getUserInitials(conversation.otherParticipant)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("font-semibold text-[15px] truncate", conversation.unreadCount > 0 && "text-foreground")}>
                  {getUserDisplayName(conversation.otherParticipant)}
                </span>
                {conversation.lastMessageAt && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true, locale: dateLocale })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={cn(
                  "text-sm truncate",
                  conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {conversation.lastMessage
                    ? conversation.lastMessage.deleted
                      ? dict.chat.messageDeletedPreview
                      : conversation.lastMessage.content
                    : dict.chat.noMessagesYet}
                </p>
                {conversation.unreadCount > 0 && (
                  <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            </div>
          </button>
        ))}

        <div className="flex justify-center pt-4">
          <Button variant="ghost" onClick={() => loadMore()} disabled={loading}>
            {loading ? dict.common.loading : dict.actions.loadMore}
          </Button>
        </div>
      </div>
    </div>
  );
}

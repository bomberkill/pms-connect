"use client";

import React, { useDeferredValue, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { BellOff, ChevronRight, Loader2, MessageCircle, Plus, Search, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/hooks/use-dictionary";
import { useConversations } from "@/hooks/useData/index";
import { cn } from "@/lib/utils";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { UserTypeGQL } from "@/types/User";

export default function ConversationsListView() {
  const dict = useDictionary();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const dateLocale = params?.lang === "fr" ? fr : enUS;
  const { conversations, loading, loadMore } = useConversations();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredConversations = conversations.filter((conversation) => {
    if (!deferredQuery) return true;
    const participant = getUserDisplayName(conversation.otherParticipant).toLowerCase();
    const lastMessage = conversation.lastMessage?.content?.toLowerCase() ?? "";
    return participant.includes(deferredQuery) || lastMessage.includes(deferredQuery);
  });

  const showUnavailable = () => {
    toast.info(dict.chat.featureUnavailable);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70svh] max-w-2xl items-center justify-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="mx-auto min-h-[100svh] max-w-2xl bg-background pb-24">
        <div className="sticky top-0 z-20 border-b border-border/70 bg-background/95 px-4 pb-4 pt-[calc(14px+env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-black tracking-[-0.03em]">{dict.chat.title}</h1>
              <p className="text-sm text-muted-foreground">{dict.chat.secureSubtitle}</p>
            </div>
            <button
              type="button"
              aria-label={dict.chat.newConversation}
              onClick={showUnavailable}
              className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-[72svh] flex-col items-center justify-center px-5 text-center">
          <div className="relative grid size-24 place-items-center rounded-[2rem] bg-gradient-to-br from-primary/15 via-secondary/10 to-muted text-primary shadow-lg shadow-primary/10">
            <MessageCircle className="size-10" />
            <span className="absolute -right-1 -top-1 grid size-8 place-items-center rounded-full bg-card text-secondary-700 ring-4 ring-background dark:text-secondary-300">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <h2 className="mt-5 font-heading text-2xl font-black tracking-[-0.04em]">
            {dict.chat.noConversationsTitle}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {dict.chat.noConversationsDescription}
          </p>
          <button
            type="button"
            onClick={showUnavailable}
            className="mt-5 flex w-full max-w-sm items-center gap-3 rounded-card border border-border bg-card px-4 py-3 text-left shadow-sm"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black tracking-[-0.01em]">{dict.chat.secureMessaging}</p>
              <p className="text-xs leading-5 text-muted-foreground">{dict.chat.textOnlyNotice}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            {dict.chat.meanwhilePrefix}{" "}
            <button type="button" className="font-bold text-primary" onClick={() => router.push("/")}>
              {dict.chat.commentsLink}
            </button>{" "}
            {dict.chat.and}{" "}
            <button type="button" className="font-bold text-primary" onClick={() => router.push("/groups")}>
              {dict.chat.groupsLink}
            </button>{" "}
            {dict.chat.meanwhileSuffix}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[100svh] max-w-2xl bg-background pb-24">
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/95 px-4 pb-3 pt-[calc(14px+env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-black tracking-[-0.03em]">{dict.chat.title}</h1>
            <p className="text-sm text-muted-foreground">{dict.chat.secureSubtitle}</p>
          </div>
          <button
            type="button"
            aria-label={dict.chat.newConversation}
            onClick={showUnavailable}
            className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="size-5" />
          </button>
        </div>

        <label className="mt-4 flex h-11 items-center gap-2 rounded-full border border-border bg-muted/60 px-4 text-sm shadow-inner shadow-background/50 focus-within:border-primary/40 focus-within:bg-background">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dict.chat.searchPlaceholder}
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <div className="px-3 py-3">
        <button
          type="button"
          onClick={showUnavailable}
          className="mb-3 flex w-full items-center gap-3 rounded-card bg-gradient-to-br from-primary/12 via-secondary/10 to-background p-3 text-left ring-1 ring-primary/10"
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-background text-primary shadow-sm">
            <BellOff className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black tracking-[-0.01em]">{dict.chat.privacyBannerTitle}</p>
            <p className="truncate text-xs text-muted-foreground">{dict.chat.privacyBannerDescription}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {filteredConversations.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-heading text-lg font-black tracking-[-0.02em]">{dict.chat.noSearchResults}</p>
            <p className="mt-1 text-sm text-muted-foreground">{dict.chat.noSearchResultsDescription}</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => router.push(`/chat/${conversation.id}`)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-card px-2 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <div className="relative shrink-0">
                <Avatar
                  shape={conversation.otherParticipant.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"}
                  className="size-[52px] ring-2 ring-background"
                >
                  <AvatarImage className="object-cover" src={conversation.otherParticipant.profilePicUrl} />
                  <AvatarFallback>{getUserInitials(conversation.otherParticipant)}</AvatarFallback>
                </Avatar>
                {conversation.unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-2xs font-black text-primary-foreground ring-2 ring-background">
                    {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-[15px] font-black tracking-[-0.01em]", conversation.unreadCount > 0 && "text-foreground")}>
                    {getUserDisplayName(conversation.otherParticipant)}
                  </span>
                  {conversation.lastMessageAt && (
                    <span className={cn("shrink-0 text-2xs font-semibold", conversation.unreadCount > 0 ? "text-primary" : "text-muted-foreground")}>
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true, locale: dateLocale })}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className={cn("truncate text-sm", conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {conversation.lastMessage
                      ? conversation.lastMessage.deleted
                        ? dict.chat.messageDeletedPreview
                        : conversation.lastMessage.content
                      : dict.chat.noMessagesYet}
                  </p>
                  {conversation.unreadCount > 0 && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                </div>
              </div>
            </button>
          ))
        )}

        <div className="flex justify-center pt-4">
          <Button variant="ghost" onClick={() => loadMore()} disabled={loading}>
            {loading ? dict.common.loading : dict.actions.loadMore}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageCircle, Plus } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSmartFeedNavigation } from "@/hooks/useSmartFeedNavigation";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useMe } from "@/hooks/useData/useUserData";
import { useConnectionRequests } from "@/hooks/useData/useConnectionData";
import { useUnreadConversationsCount } from "@/hooks/useData/useMessageData";
import { ConnectionRequestStatus } from "@/types/ConnectionRequest";
import { getUserDisplayName } from "@/lib/user-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserTypeGQL } from "@/types/User";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import CreatePostComposerMobile from "@/components/CreatePostComposerMobile";

/**
 * Bottom-nav dot semantics from the design system: teal = "new content on
 * this tab", amber = "module not open yet". Never a filled number badge —
 * unread *counts* live on the header bell instead (see NotificationBadge).
 */
function TabDot({ tone }: { tone: "teal" | "amber" }) {
  return (
    <span
      className={cn(
        "absolute right-1/2 top-0.5 size-1.5 translate-x-3 rounded-full ring-2 ring-background",
        tone === "teal" ? "bg-secondary-500" : "bg-tertiary-500"
      )}
    />
  );
}

export function BottomNav() {
  const dict = useDictionary();
  const pathname = usePathname();
  const cleanPathname = React.useMemo(() => {
    if (!pathname) return "/";
    for (const locale of ["en", "fr"]) {
      if (pathname === `/${locale}`) return "/";
      if (pathname.startsWith(`/${locale}/`)) return pathname.replace(`/${locale}`, "");
    }
    return pathname;
  }, [pathname]);
  const isMobile = useIsMobile();
  const { navigateToFeed } = useSmartFeedNavigation("/");
  const scrollDirection = useScrollDirection();
  const { me } = useMe();
  const [isCreatePostOpen, setIsCreatePostOpen] = React.useState(false);
  // Same "pending, addressed to me" filter as FriendsTabs — this is the
  // signal for the Relations tab's teal dot, not a raw request count.
  const { requests } = useConnectionRequests(ConnectionRequestStatus.PENDING);
  const pendingIncoming = requests.filter(
    (r) => r.status === ConnectionRequestStatus.PENDING && r.recipient.id === me?.id
  ).length;

  const { unreadCount: unreadConversations, subscribeToNewMessages } = useUnreadConversationsCount();
  useEffect(() => {
    const unsubscribe = subscribeToNewMessages();
    return () => unsubscribe();
  }, [subscribeToNewMessages]);

  // Post detail pages and open conversation threads have their own sticky
  // composer pinned to the bottom of the screen; showing the tab bar too
  // would stack two fixed-bottom bars on top of each other. The bare /chat
  // list page has no composer, so it keeps the tab bar.
  if (!isMobile || cleanPathname.includes("/post/") || cleanPathname.includes("/chat/")) return null;

  const shouldShowComposer = !["/comment/", "/messages", "/jobs", "/marketplace"]
    .some((path) => cleanPathname.includes(path));

  const items = [
    { key: "feed", href: "/", icon: Home, label: dict.appSideBar.navMain.feed, isActive: cleanPathname === "/", onClick: navigateToFeed },
    { key: "friends", href: "/friends", icon: Users, label: dict.appSideBar.navMain.friends, isActive: cleanPathname === "/friends", dot: pendingIncoming > 0 ? ("teal" as const) : undefined },
    { key: "chat", href: "/chat", icon: MessageCircle, label: dict.appSideBar.navMain.messages, isActive: cleanPathname.startsWith("/chat"), dot: unreadConversations > 0 ? ("teal" as const) : undefined },
  ];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] transition-transform duration-300",
        scrollDirection === "down" ? "translate-y-full" : "translate-y-0"
      )}
    >
      <div className="flex h-[61px] items-start px-2 pt-[7px]">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-start gap-[3px] text-muted-foreground transition-colors",
                item.isActive && "text-primary"
              )}
            >
              {item.isActive && <span className="absolute -top-[7px] h-[2.5px] w-7 rounded-b-sm bg-primary" />}
              <span className="relative">
                <Icon className="size-[23px]" strokeWidth={item.isActive ? 2.1 : 1.8} />
                {item.dot && <TabDot tone={item.dot} />}
              </span>
              <span className={cn("text-2xs", item.isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
        <div className="flex h-full w-[76px] shrink-0 justify-center">
          <Drawer open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DrawerTrigger asChild>
              <Button
                type="button"
                disabled={!shouldShowComposer}
                aria-label={dict.header.addNewPost}
                className="mt-[-20px] size-[52px] rounded-[18px] border-[3px] border-background bg-primary p-0 text-primary-foreground shadow-[0_8px_20px_-6px_rgba(43,82,220,.55)] hover:bg-primary/90 disabled:opacity-50 md:hidden"
              >
                <Plus className="size-6" strokeWidth={2.4} />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[92svh] max-h-[92svh]">
              <DrawerTitle className="sr-only">{dict.header.addNewPost}</DrawerTitle>
              <CreatePostComposerMobile className="flex h-full w-full flex-col" onCreated={() => setIsCreatePostOpen(false)} />
            </DrawerContent>
          </Drawer>
        </div>
        {items.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-start gap-[3px] text-muted-foreground transition-colors",
                item.isActive && "text-primary"
              )}
            >
              {item.isActive && <span className="absolute -top-[7px] h-[2.5px] w-7 rounded-b-sm bg-primary" />}
              <span className="relative">
                <Icon className="size-[23px]" strokeWidth={item.isActive ? 2.1 : 1.8} />
                {item.dot && <TabDot tone={item.dot} />}
              </span>
              <span className={cn("text-2xs", item.isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={me ? `/profile/${me.slug}` : "/settings"}
          className={cn(
            "relative flex h-full w-full flex-col items-center justify-start gap-[3px] text-muted-foreground transition-colors",
            cleanPathname.startsWith("/profile") && me && cleanPathname === `/profile/${me.slug}` && "text-primary"
          )}
        >
          {cleanPathname === `/profile/${me?.slug}` && <span className="absolute -top-[7px] h-[2.5px] w-7 rounded-b-sm bg-primary" />}
          <Avatar shape={me?.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"} className="size-[23px] border border-background shadow-[0_0_0_1px_var(--border)]">
            <AvatarImage src={me?.profilePicUrl} alt={me ? getUserDisplayName(me) : ""} />
            <AvatarFallback className="text-2xs">{me ? getUserDisplayName(me).slice(0, 2).toUpperCase() : ""}</AvatarFallback>
          </Avatar>
          <span className="text-2xs font-medium">{dict.appSideBar.navMain.profile}</span>
        </Link>
      </div>
    </nav>
  );
}

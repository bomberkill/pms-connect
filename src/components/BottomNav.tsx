"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageCircle } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSmartFeedNavigation } from "@/hooks/useSmartFeedNavigation";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useMe } from "@/hooks/useData/useUserData";
import { useConnectionRequests } from "@/hooks/useData/useConnectionData";
import { ConnectionRequestStatus } from "@/types/ConnectionRequest";
import { getUserDisplayName } from "@/lib/user-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserTypeGQL } from "@/types/User";

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
  const isMobile = useIsMobile();
  const { navigateToFeed } = useSmartFeedNavigation("/");
  const scrollDirection = useScrollDirection();
  const { me } = useMe();
  // Same "pending, addressed to me" filter as FriendsTabs — this is the
  // signal for the Relations tab's teal dot, not a raw request count.
  const { requests } = useConnectionRequests(ConnectionRequestStatus.PENDING);
  const pendingIncoming = requests.filter(
    (r) => r.status === ConnectionRequestStatus.PENDING && r.recipient.id === me?.id
  ).length;

  // Post detail pages have their own sticky reply composer pinned to the
  // bottom of the screen; showing the tab bar too would stack two
  // fixed-bottom bars on top of each other.
  if (!isMobile || pathname?.includes("/post/")) return null;

  const items = [
    { key: "feed", href: "/", icon: Home, label: dict.appSideBar.navMain.feed, isActive: pathname === "/", onClick: navigateToFeed },
    { key: "friends", href: "/friends", icon: Users, label: dict.appSideBar.navMain.friends, isActive: pathname === "/friends", dot: pendingIncoming > 0 ? ("teal" as const) : undefined },
    { key: "chat", href: "/chat", icon: MessageCircle, label: dict.appSideBar.navMain.messages, isActive: pathname === "/chat", dot: "amber" as const },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t pb-[env(safe-area-inset-bottom)] transition-transform duration-300",
      scrollDirection === "down" ? "translate-y-full" : "translate-y-0"
    )}>
      <div className="flex h-16 items-stretch px-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                "relative flex w-full flex-col items-center justify-center gap-1 text-muted-foreground transition-colors active:scale-95",
                item.isActive && "text-primary"
              )}
            >
              {item.isActive && <span className="absolute top-0 h-[2.5px] w-8 rounded-full bg-primary" />}
              <span className="relative">
                <Icon className="size-6" strokeWidth={item.isActive ? 2.5 : 2} />
                {item.dot && <TabDot tone={item.dot} />}
              </span>
              <span className={cn("text-2xs", item.isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={me ? `/profile/${me.slug}` : "/settings"}
          className={cn(
            "relative flex w-full flex-col items-center justify-center gap-1 text-muted-foreground transition-colors active:scale-95",
            pathname?.startsWith("/profile") && me && pathname === `/profile/${me.slug}` && "text-primary"
          )}
        >
          {pathname === `/profile/${me?.slug}` && <span className="absolute top-0 h-[2.5px] w-8 rounded-full bg-primary" />}
          <Avatar shape={me?.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"} className="size-6">
            <AvatarImage src={me?.profilePicUrl} alt={me ? getUserDisplayName(me) : ""} />
            <AvatarFallback className="text-2xs">{me ? getUserDisplayName(me).slice(0, 2).toUpperCase() : ""}</AvatarFallback>
          </Avatar>
          <span className="text-2xs font-medium">{dict.appSideBar.navMain.profile}</span>
        </Link>
      </div>
    </nav>
  );
}

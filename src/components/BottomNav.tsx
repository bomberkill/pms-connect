"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDictionary } from "@/hooks/use-dictionary";
import { getNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSmartFeedNavigation } from "@/hooks/useSmartFeedNavigation";

export function BottomNav() {
    const dict = useDictionary();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const navItems = getNavItems(dict, pathname || "/");
    const { navigateToFeed } = useSmartFeedNavigation("/");

    if (!isMobile) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.slice(0, 5).map((item) => { // Limit to 5 items for mobile bottom bar
                    const Icon = item.icon;
                    const isFeedLink = item.url === "/" || item.url.endsWith("/");

                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            onClick={isFeedLink ? navigateToFeed : undefined}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground transition-colors hover:text-primary active:scale-95",
                                item.isActive && "text-primary"
                            )}
                        >
                            <Icon className={cn("size-6", item.isActive && "fill-current")} strokeWidth={item.isActive ? 2.5 : 2} />
                            {/* Optional: Show label only for active or if space permits. For now, icon only is cleaner. */}
                            <span className="text-[10px] font-medium">{item.title}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { User, UserTypeGQL } from "@/types/User";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/hooks/use-dictionary";

interface UserListItemProps {
    user: User;
    action?: React.ReactNode;
    subtitle?: string;
    /** Real count of connections shared with the viewer — pass 0/undefined
     *  to omit the line entirely rather than showing a fake "0 en commun". */
    mutualCount?: number;
    onClick?: () => void;
    className?: string;
}

export function UserListItem({ user, action, subtitle, mutualCount, onClick, className }: UserListItemProps) {
    const dict = useDictionary();
    const isEstablishment = user.userType === UserTypeGQL.LEGAL_ENTITY;

    return (
        <div
            className={cn("flex items-center justify-between gap-2 p-3 rounded-2xl bg-muted/40", className)}
            onClick={onClick}
        >
            <Link href={`/profile/${user.slug}`} className="flex items-center gap-3 overflow-hidden min-w-0">
                <Avatar shape={isEstablishment ? "establishment" : "person"} className="h-11 w-11 shrink-0">
                    <AvatarImage src={user.profilePicUrl} alt={getUserDisplayName(user)} />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{getUserDisplayName(user)}</span>
                    <span className="text-xs text-muted-foreground truncate">
                        {subtitle || (user.userType === UserTypeGQL.INDIVIDUAL ? user.professionalTitle : dict.entityTypes[user.entityType])}
                    </span>
                    {!!mutualCount && (
                        <span className="text-2xs text-muted-foreground mt-0.5">
                            {dict.friends.mutualConnections.replace("{count}", String(mutualCount))}
                        </span>
                    )}
                </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
                {action}
            </div>
        </div>
    );
}

"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { User } from "@/types/User";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserListItemProps {
    user: User;
    action?: React.ReactNode;
    subtitle?: string;
    onClick?: () => void;
    className?: string;
}

export function UserListItem({ user, action, subtitle, onClick, className }: UserListItemProps) {
    return (
        <div
            className={cn("flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm", className)}
            onClick={onClick}
        >
            <Link href={`/profile/${user.slug}`} className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-10 w-10 border border-border shrink-0">
                    <AvatarImage src={user.profilePicUrl} alt={getUserDisplayName(user)} />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{getUserDisplayName(user)}</span>
                    <span className="text-xs text-muted-foreground truncate">
                        {subtitle || (user.userType === "INDIVIDUAL" ? user.professionalTitle : user.entityType)}
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0 ml-2">
                {action}
            </div>
        </div>
    );
}

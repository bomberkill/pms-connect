"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { User } from "@/types/User";
import { UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { useConnectionActions } from "@/hooks/useData/index";

interface SuggestionCardProps {
    user: User;
}

export function SuggestionCard({ user }: SuggestionCardProps) {
    const dict = useDictionary();
    //   const { followUser, unfollowUser, following, unfollowing } = useFollowActions();
    const { sendRequest, sending } = useConnectionActions();
    // const { me } = useMe();

    const handleConnect = async () => {
        try {
            await sendRequest({ variables: { recipientId: user.id } });
        } catch (error) {
            console.error("Failed to send request", error);
        }
    };

    return (
        <div className="flex flex-col items-center p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all text-center">
            <Link href={`/profile/${user.slug}`}>
                <Avatar className="h-16 w-16 mb-3 border-2 border-border">
                    <AvatarImage src={user.profilePicUrl} alt={getUserDisplayName(user)} />
                    <AvatarFallback className="text-lg">{getUserInitials(user)}</AvatarFallback>
                </Avatar>
            </Link>

            <Link href={`/profile/${user.slug}`} className="mb-1">
                <span className="font-semibold text-sm hover:underline">{getUserDisplayName(user)}</span>
            </Link>

            <span className="text-xs text-muted-foreground line-clamp-1 mb-4 h-4">
                {user.userType === "INDIVIDUAL" ? user.professionalTitle : user.entityType}
            </span>

            <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleConnect}
                disabled={sending}
            >
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                <span>{dict.actions.connect || "Connect"}</span>
            </Button>
        </div>
    );
}

"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConnectionActions } from "@/hooks/useData/index";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { ConnectionRequest } from "@/types/ConnectionRequest";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
interface ConnectionItemCardProps {
    request: ConnectionRequest;
    isSent: boolean;
}

export function ConnectionItemCard({ request, isSent }: ConnectionItemCardProps) {
    const dict = useDictionary();
    const { acceptRequest, declineRequest } = useConnectionActions();

    // If I sent the request, I am the requester. The other person is the recipient.
    // If I received the request, I am the recipient. The other person is the requester.
    const friend = isSent ? request.recipient : request.requester;

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
            <Link href={`/profile/${friend.slug}`} className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={friend.profilePicUrl} alt={getUserDisplayName(friend)} />
                    <AvatarFallback>{getUserInitials(friend)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm hover:underline">{getUserDisplayName(friend)}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                        {friend.userType === "INDIVIDUAL" ? friend.professionalTitle : friend.entityType}
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-2">
                {isSent ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => declineRequest({ variables: { requestId: request.id } })}
                    >
                        {dict.actions.cancelRequest || "Cancel"}
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => declineRequest({ variables: { requestId: request.id } })}
                            title="Reject"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => acceptRequest({ variables: { requestId: request.id } })}
                            title="Accept"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

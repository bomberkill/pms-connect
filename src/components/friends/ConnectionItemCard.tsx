"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useConnectionActions, useFollowActions, useMe } from "@/hooks/useData/index";
import { UserListItem } from "@/components/UserListItem";
import { ConnectionRequest } from "@/types/ConnectionRequest";
import { User } from "@/types/User";
import { getMutualConnectionsCount } from "@/lib/user-utils";
import { Check, X, UserMinus, Loader2 } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";

type ConnectionItemCardProps =
    | { variant: "received"; request: ConnectionRequest }
    | { variant: "sent"; request: ConnectionRequest }
    | { variant: "connected"; user: User }
    | { variant: "following"; user: User };

export function ConnectionItemCard(props: ConnectionItemCardProps) {
    const dict = useDictionary();
    const { me } = useMe();
    const { acceptRequest, declineRequest, removeConnection, removing } = useConnectionActions();
    const { unfollowUser, unfollowing } = useFollowActions();

    if (props.variant === "connected" || props.variant === "following") {
        return (
            <UserListItem
                user={props.user}
                mutualCount={getMutualConnectionsCount(me, props.user)}
                className="rounded-none bg-transparent px-0 py-3"
                avatarClassName="h-10 w-10"
                action={
                    props.variant === "connected" ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeConnection({ variables: { userIdB: props.user.id } })}
                            disabled={removing}
                            aria-label={dict.actions.disconnect}
                            title={dict.actions.disconnect}
                        >
                            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full px-4 text-xs"
                            onClick={() => unfollowUser({ variables: { userId: props.user.id } })}
                            disabled={unfollowing}
                        >
                            {unfollowing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {dict.actions.unfollow}
                        </Button>
                    )
                }
            />
        );
    }

    const { request } = props;
    const friend = props.variant === "sent" ? request.recipient : request.requester;

    return (
        <UserListItem
            user={friend}
            mutualCount={getMutualConnectionsCount(me, friend)}
            className={props.variant === "received" ? "items-start rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.7)]" : "rounded-none bg-transparent px-0 py-3"}
            avatarClassName={props.variant === "received" ? "h-12 w-12" : "h-10 w-10"}
            action={
                props.variant === "sent" ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => declineRequest({ variables: { requestId: request.id } })}
                    >
                        {dict.actions.cancelRequest}
                    </Button>
                ) : (
                    <div className="flex shrink-0 flex-col gap-2 xs:flex-row">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full px-4 text-xs"
                            onClick={() => declineRequest({ variables: { requestId: request.id } })}
                            aria-label={dict.actions.declineRequest}
                            title={dict.actions.declineRequest}
                        >
                            <X className="h-3.5 w-3.5" />
                            {dict.actions.ignore ?? dict.actions.declineRequest}
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 rounded-full px-4 text-xs"
                            onClick={() => acceptRequest({ variables: { requestId: request.id } })}
                            aria-label={dict.actions.acceptRequest}
                            title={dict.actions.acceptRequest}
                        >
                            <Check className="h-3.5 w-3.5" />
                            {dict.actions.accept}
                        </Button>
                    </div>
                )
            }
        />
    );
}

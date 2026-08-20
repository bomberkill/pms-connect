"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useConnectionActions } from "@/hooks/useData/index";
import { UserListItem } from "@/components/UserListItem";
import { ConnectionRequest } from "@/types/ConnectionRequest";
import { User } from "@/types/User";
import { Check, X, UserMinus, Loader2 } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";

type ConnectionItemCardProps =
    | { variant: "received"; request: ConnectionRequest }
    | { variant: "sent"; request: ConnectionRequest }
    | { variant: "connected"; user: User };

export function ConnectionItemCard(props: ConnectionItemCardProps) {
    const dict = useDictionary();
    const { acceptRequest, declineRequest, removeConnection, removing } = useConnectionActions();

    if (props.variant === "connected") {
        return (
            <UserListItem
                user={props.user}
                action={
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
                }
            />
        );
    }

    const { request } = props;
    const friend = props.variant === "sent" ? request.recipient : request.requester;

    return (
        <UserListItem
            user={friend}
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
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => declineRequest({ variables: { requestId: request.id } })}
                            aria-label={dict.actions.declineRequest}
                            title={dict.actions.declineRequest}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            onClick={() => acceptRequest({ variables: { requestId: request.id } })}
                            aria-label={dict.actions.acceptRequest}
                            title={dict.actions.acceptRequest}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    </>
                )
            }
        />
    );
}

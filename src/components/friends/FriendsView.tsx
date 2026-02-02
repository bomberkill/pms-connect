"use client";

import React from "react";
import { ConnectionRequest } from "@/types/ConnectionRequest";
// import { ConnectionRequestCard } from "./ConnectionRequestCard";
import { SuggestionsCarousel } from "./SuggestionsCarousel";
import { SuggestionItem } from "../Suggestions-sidebar";
import { User } from "@/types/User";
import { useConnectionActions } from "@/hooks/useData/useConnectionData";
import { Button } from "../ui/button";
import UserCard from "../UserCard";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Plus, X } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";

interface Props {
    pending: ConnectionRequest[];
    me?: User;
    suggested?: User[];
    //   accepted: ConnectionRequest[];
    loading: boolean;
}

export default function FriendsView({ pending, me, suggested }: Props) {
    const { acceptRequest, declineRequest, } = useConnectionActions()
    const isMobile = useIsMobile();
    const dict = useDictionary();
    const isTablet = useIsTablet();
    return (
        <div className="p-4 sm:p-8">
            {pending.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-md font-medium mb-4">{dict.friends.connectionRequests}</h2>
                    {isMobile ? (
                        <div>
                            {pending.map((req) => (
                                <>
                                    <div className="flex items-center justify-between">
                                        <SuggestionItem key={req.id} friend={me?.id === req.requester.id ? req.recipient : req.requester} />
                                        {
                                            req.requester.id === me?.id ? (
                                                <Button className="cursor-pointer" variant="outline" size="icon" onClick={() => declineRequest({ variables: { requestId: req.id } })} aria-label={dict.actions.cancelRequest}>
                                                    <X className="size-4" />
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Button className="cursor-pointer hover:bg-destructive/10 hover:text-destructive border-destructive/20" variant="outline" size="icon" onClick={() => declineRequest({ variables: { requestId: req.id } })} aria-label={dict.actions.declineRequest}>
                                                        <X className="size-4" />
                                                    </Button>
                                                    <Button className="cursor-pointer" size="icon" onClick={() => { acceptRequest({ variables: { requestId: req.id } }) }} aria-label={dict.actions.acceptRequest}>
                                                        <Plus className="size-4" />
                                                    </Button>
                                                </div>
                                            )
                                        }
                                    </div>
                                    <Separator className="my-2" />
                                </>
                            ))}
                        </div>
                    ) : (

                        <div className={cn("grid grid-cols-5 items-center gap-2", isTablet && "grid-cols-4")}>
                            {pending.map((req) => (
                                <UserCard requestId={req.id} key={req.id} friend={me?.id === req.recipient.id ? req.requester : req.recipient} isRequest={me?.id === req.recipient.id ? 'recipient' : 'requester'} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="w-full">
                <h2 className="text-md font-medium mb-4">{dict.friends.suggestions}</h2>
                {/* <SuggestionsCarousel suggestions={Array(6).fill(suggested).flat()} /> */}
                <SuggestionsCarousel suggestions={suggested ? suggested.filter((item) => item.id !== me?.id && !me?.following?.includes(item.id)) : []} />
            </div>
        </div>
    );
}

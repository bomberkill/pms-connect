"use client";

import React, { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/hooks/use-dictionary";
import { ConnectionRequest, ConnectionRequestStatus } from "@/types/ConnectionRequest";
import { User } from "@/types/User";
import { getUserDisplayName } from "@/lib/user-utils";

import { ConnectionItemCard } from "./ConnectionItemCard";
import { Loader2, UserPlus, Users, UserCheck, Ghost } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "../ui/empty-state";
import { UserListItem } from "../UserListItem";
import { useConnectionActions } from "@/hooks/useData/index";

interface FriendsTabsProps {
    requests: ConnectionRequest[];
    suggestions: User[];
    connections?: User[];
    me?: User;
    loading: boolean;
}

export default function FriendsTabs({ requests, suggestions, connections = [], me, loading }: FriendsTabsProps) {
    const dict = useDictionary();
    const [searchQuery, setSearchQuery] = useState("");

    const pendingRequests = requests.filter(r => r.status === ConnectionRequestStatus.PENDING && r.recipient.id === me?.id);
    const sentRequests = requests.filter(r => r.status === ConnectionRequestStatus.PENDING && r.requester.id === me?.id);

    const filteredConnections = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return connections;
        return connections.filter((friend) => getUserDisplayName(friend).toLowerCase().includes(q));
    }, [connections, searchQuery]);

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{dict.friends.title}</h1>
                <p className="text-muted-foreground">{dict.friends.subtitle}</p>
            </div>

            <Tabs defaultValue="connections" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="connections" className="gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">{dict.friends.tabs.connections}</span>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2 relative">
                        <UserCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">{dict.friends.tabs.requests}</span>
                        {pendingRequests.length > 0 && (
                            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="suggestions" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">{dict.friends.tabs.suggestions}</span>
                    </TabsTrigger>
                </TabsList>

                {/* --- MY CONNECTIONS --- */}
                <TabsContent value="connections" className="space-y-3">
                    {connections.length > 0 && (
                        <Input
                            placeholder={dict.friends.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    )}

                    <div className="space-y-2">
                        {filteredConnections.length > 0 ? (
                            filteredConnections.map((friend) => (
                                <ConnectionItemCard key={friend.id} variant="connected" user={friend} />
                            ))
                        ) : (
                            <EmptyState
                                icon={Users}
                                title={dict.friends.empty.connections.title}
                                description={dict.friends.empty.connections.description}
                            />
                        )}
                    </div>
                </TabsContent>

                {/* --- REQUESTS --- */}
                <TabsContent value="requests" className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{dict.friends.sections.received} ({pendingRequests.length})</h3>
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                        ) : pendingRequests.length > 0 ? (
                            <div className="space-y-2">
                                {pendingRequests.map(req => (
                                    <ConnectionItemCard key={req.id} variant="received" request={req} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Ghost}
                                title={dict.friends.empty.requests.title}
                                description={dict.friends.empty.requests.description}
                            />
                        )}
                    </div>

                    {sentRequests.length > 0 && (
                        <div className="pt-4 border-t">
                            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{dict.friends.sections.sent} ({sentRequests.length})</h3>
                            <div className="space-y-2">
                                {sentRequests.map(req => (
                                    <ConnectionItemCard key={req.id} variant="sent" request={req} />
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* --- SUGGESTIONS --- */}
                <TabsContent value="suggestions">
                    {suggestions.length > 0 ? (
                        <div className="space-y-2">
                            {suggestions.map(user => (
                                <SuggestionRow key={user.id} user={user} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={UserPlus}
                            title={dict.friends.empty.suggestions.title}
                            description={dict.friends.empty.suggestions.description}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SuggestionRow({ user }: { user: User }) {
    const { sendRequest, sending } = useConnectionActions();
    const dict = useDictionary();

    return (
        <UserListItem
            user={user}
            action={
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendRequest({ variables: { recipientId: user.id } })}
                    disabled={sending}
                >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    <span className="hidden sm:inline">{dict.actions.connect}</span>
                </Button>
            }
        />
    )
}

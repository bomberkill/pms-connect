"use client";

import React, { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/hooks/use-dictionary";
import { ConnectionRequest, ConnectionRequestStatus } from "@/types/ConnectionRequest";
import { User } from "@/types/User";
import { getUserDisplayName } from "@/lib/user-utils";

import { ConnectionItemCard } from "./ConnectionItemCard";
import { Bell, Loader2, Search, SlidersHorizontal, UserPlus, Users, UserCheck, Ghost } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "../ui/empty-state";
import { UserListItem } from "../UserListItem";
import { useConnectionActions } from "@/hooks/useData/index";
import { getMutualConnectionsCount } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

interface FriendsTabsProps {
    requests: ConnectionRequest[];
    suggestions: User[];
    connections?: User[];
    following?: User[];
    me?: User;
    loading: boolean;
}

export default function FriendsTabs({ requests, suggestions, connections = [], following = [], me, loading }: FriendsTabsProps) {
    const dict = useDictionary();
    const [activeTab, setActiveTab] = useState("connections");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAllSuggestions, setShowAllSuggestions] = useState(false);
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [isPending, startTransition] = useTransition();

    const pendingRequests = requests.filter(r => r.status === ConnectionRequestStatus.PENDING && r.recipient.id === me?.id);
    const sentRequests = requests.filter(r => r.status === ConnectionRequestStatus.PENDING && r.requester.id === me?.id);

    const filteredConnections = useMemo(() => {
        const q = deferredSearchQuery.trim().toLowerCase();
        if (!q) return connections;
        return connections.filter((friend) => getUserDisplayName(friend).toLowerCase().includes(q));
    }, [connections, deferredSearchQuery]);

    const firstSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 6);
    const pendingPreview = pendingRequests.slice(0, 3);

    return (
        <div className="mx-auto w-full max-w-2xl pb-24 md:px-6 md:pt-6">
            <div className="sticky top-0 z-20 border-b border-border/70 bg-card/95 px-4 pb-0 pt-2 backdrop-blur-xl md:static md:-mx-6 md:px-6 md:pb-3">
                <div className="flex h-[50px] items-center justify-between gap-3">
                    <h1 className="font-heading text-[21px] font-semibold tracking-[-0.025em] text-foreground">{dict.friends.title}</h1>
                    <div className="flex items-center gap-1">
                        <button type="button" className="relative flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label={dict.appSideBar.navUser.notifications}>
                            <Bell className="size-5" strokeWidth={1.9} />
                            {pendingRequests.length > 0 && (
                                <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full border-2 border-card bg-destructive px-1 text-[9.5px] font-bold leading-none text-destructive-foreground">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                        <button type="button" className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label={dict.header.search}>
                            <Search className="size-5" strokeWidth={1.9} />
                        </button>
                    </div>
                </div>
                <div className="flex">
                    <TabHeader active={activeTab === "requests"} label={dict.friends.tabs.requests} count={pendingRequests.length} onClick={() => setActiveTab("requests")} />
                    <TabHeader active={activeTab === "connections"} label={dict.friends.tabs.connections} onClick={() => setActiveTab("connections")} />
                    <TabHeader active={activeTab === "following"} label={dict.friends.tabs.following} onClick={() => setActiveTab("following")} />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="hidden h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-0 bg-transparent p-0 pb-1 md:flex">
                    <TabsTrigger value="requests" className="min-h-9 shrink-0 gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {dict.friends.tabs.requests}
                        {pendingRequests.length > 0 && (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-background/20 px-1 text-[11px] font-black">
                                {pendingRequests.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="connections" className="min-h-9 shrink-0 gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {dict.friends.tabs.connections}
                    </TabsTrigger>
                    <TabsTrigger value="following" className="min-h-9 shrink-0 gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {dict.friends.tabs.following}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="mt-5 space-y-7">
                    <section className="space-y-3">
                        <SectionHeader title={`${dict.friends.sections.requests} ${pendingRequests.length ? pendingRequests.length : ""}`.trim()} />
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : pendingRequests.length > 0 ? (
                            <div className="space-y-3">
                                {pendingPreview.map(req => (
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
                    </section>

                    <section className="space-y-2">
                        <SectionHeader
                            title={dict.friends.tabs.connections}
                            action={connections.length > 3 ? dict.actions.seeAll : undefined}
                            onAction={() => setActiveTab("connections")}
                        />
                        <div className="divide-y divide-border/70">
                            {connections.slice(0, 3).map(friend => (
                                <ConnectionItemCard key={friend.id} variant="connected" user={friend} />
                            ))}
                            {connections.length === 0 && (
                                <p className="rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">{dict.friends.empty.connections.description}</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-2">
                        <SectionHeader
                            title={dict.friends.tabs.suggestions}
                            action={!showAllSuggestions && suggestions.length > 6 ? dict.actions.seeAll : undefined}
                            onAction={() => setShowAllSuggestions(true)}
                        />
                        <div className="divide-y divide-border/70">
                            {firstSuggestions.map(user => (
                                <SuggestionRow key={user.id} user={user} me={me} />
                            ))}
                            {firstSuggestions.length === 0 && (
                                <p className="rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">{dict.friends.noSuggestions}</p>
                            )}
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="connections" className="mt-0 space-y-0 md:mt-5 md:space-y-3">
                    {connections.length > 0 && (
                        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3 md:rounded-[18px] md:border">
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    className="h-[38px] rounded-full border-border bg-card pl-9 text-sm"
                                    placeholder={dict.friends.searchInRelations.replace("{count}", String(connections.length))}
                                    value={searchQuery}
                                    onChange={(e) => startTransition(() => setSearchQuery(e.target.value))}
                                />
                                {isPending && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}
                            </div>
                            <button type="button" className="flex h-[38px] shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] font-semibold text-muted-foreground">
                                <SlidersHorizontal className="size-3.5" strokeWidth={1.9} />
                                {dict.friends.sortRecent}
                            </button>
                        </div>
                    )}

                    <div className="divide-y divide-border/70 bg-card md:rounded-[18px] md:border">
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

                <TabsContent value="following" className="mt-5">
                    {following.length > 0 ? (
                        <div className="divide-y divide-border/70 bg-card px-4 md:rounded-[18px] md:border md:px-0">
                            {following.map(user => (
                                <ConnectionItemCard key={user.id} variant="following" user={user} />
                            ))}
                        </div>
                    ) : sentRequests.length > 0 ? (
                        <section className="space-y-2">
                            <SectionHeader title={dict.friends.sections.sent} />
                            <div className="divide-y divide-border/70">
                                {sentRequests.map(req => (
                                    <ConnectionItemCard key={req.id} variant="sent" request={req} />
                                ))}
                            </div>
                        </section>
                    ) : (
                        <EmptyState
                            icon={UserCheck}
                            title={dict.friends.empty.following.title}
                            description={dict.friends.empty.following.description}
                        />
                    )}
                </TabsContent>

            </Tabs>
        </div>
    );
}

function TabHeader({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
    return (
        <button
            type="button"
            className={cn(
                "mr-5 flex h-11 items-center text-[14.5px]",
                active
                    ? "font-semibold text-primary shadow-[inset_0_-2.5px_0_hsl(var(--primary))]"
                    : "font-medium text-muted-foreground"
            )}
            onClick={onClick}
        >
            {label}
            {!!count && (
                <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[12px] font-bold leading-none text-destructive-foreground">
                    {count}
                </span>
            )}
        </button>
    );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black tracking-[-0.02em] text-foreground">{title}</h2>
            {action && <button type="button" className="text-xs font-bold text-primary" onClick={onAction}>{action}</button>}
        </div>
    );
}

function SuggestionRow({ user, me }: { user: User; me?: User }) {
    const { sendRequest, sending } = useConnectionActions();
    const dict = useDictionary();

    return (
        <UserListItem
            user={user}
            mutualCount={getMutualConnectionsCount(me, user)}
            className={cn("rounded-none bg-transparent px-0 py-3")}
            avatarClassName="h-10 w-10"
            action={
                <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full px-4 text-xs"
                    onClick={() => sendRequest({ variables: { recipientId: user.id } })}
                    disabled={sending}
                >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    <span>{dict.actions.connect}</span>
                </Button>
            }
        />
    )
}

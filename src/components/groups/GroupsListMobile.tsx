"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, ShieldCheck, Users } from "lucide-react";
import { useGroups } from "@/hooks/useData/useGroups";
import { useMe } from "@/hooks/useData/useUserData";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { Group, GroupJoinRequestStatus, GroupMemberRole, GroupPrivacy } from "@/types/Group";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGroupMutations, useMyGroupJoinRequests } from "@/hooks/useData/useGroups";
import { toast } from "sonner";

function privacyLabel(privacy: GroupPrivacy, dict: ReturnType<typeof useDictionary>) {
    switch (privacy) {
        case GroupPrivacy.PUBLIC: return dict.groups.form.public;
        case GroupPrivacy.PRIVATE: return dict.groups.form.private;
        case GroupPrivacy.SECRET: return dict.groups.form.secret;
    }
}

function GroupRow({
    group,
    myUserId,
    pendingRequestGroupIds,
    onJoin,
    joining,
}: {
    group: Group;
    myUserId?: string;
    pendingRequestGroupIds: Set<string>;
    onJoin: (group: Group) => void;
    joining: boolean;
}) {
    const dict = useDictionary();
    const myMembership = group.members?.find((m) => (m.user.id || (m.user as { _id?: string })._id) === myUserId);
    const isMember = Boolean(myMembership);
    const isPending = pendingRequestGroupIds.has(group._id);
    const isPrivate = group.privacy !== GroupPrivacy.PUBLIC;
    const membersCount = group.members?.length ?? 0;

    return (
        <div className="flex items-center gap-3 border-t border-border px-4 py-3.5 first:border-t-0">
            <Link href={`/groups/${group.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar shape="establishment" className="size-[50px] shrink-0">
                    <AvatarFallback className="text-lg">{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold leading-tight">{group.name}</p>
                        {myMembership?.role === GroupMemberRole.ADMIN && (
                            <span className="shrink-0 rounded-full bg-primary-100 px-1.5 py-0.5 text-2xs font-semibold text-primary-800 dark:bg-primary/20 dark:text-primary-foreground">
                                {dict.groups.roles.admin}
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {privacyLabel(group.privacy, dict)} · {membersCount} {dict.groups.memberCountLabel}
                    </p>
                    {isMember && group.postsRequireApproval && (
                        <p className="mt-1 text-2xs font-semibold text-primary">{dict.groups.newPostsHint}</p>
                    )}
                </div>
            </Link>
            {!isMember && (
                <Button
                    size="sm"
                    variant={isPrivate ? "outline" : "default"}
                    className="h-8 shrink-0 rounded-full px-3 text-xs"
                    disabled={joining || isPending}
                    onClick={() => onJoin(group)}
                >
                    {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {isPending ? dict.groups.requestPending : isPrivate ? dict.groups.request : dict.groups.joinShort}
                </Button>
            )}
        </div>
    );
}

export default function GroupsListMobile() {
    const dict = useDictionary();
    const { me } = useMe();
    const { groups, loading } = useGroups({ limit: 50 });
    const { requests, refresh: refreshRequests } = useMyGroupJoinRequests({ status: GroupJoinRequestStatus.PENDING, limit: 50 });
    const { requestToJoinGroup, joining } = useGroupMutations();
    const [tab, setTab] = useState<"mine" | "discover">("mine");

    const myUserId = me?.id || (me as { _id?: string } | undefined)?._id;
    const pendingRequestGroupIds = useMemo(() => new Set(requests.map((request) => request.group._id)), [requests]);

    const { myGroups, discoverGroups } = useMemo(() => {
        const mine: Group[] = [];
        const discover: Group[] = [];
        for (const group of groups) {
            const isMember = group.members?.some((m) => (m.user.id || (m.user as { _id?: string })._id) === myUserId);
            if (isMember) mine.push(group);
            else if (group.privacy !== GroupPrivacy.SECRET) discover.push(group);
        }
        return { myGroups: mine, discoverGroups: discover };
    }, [groups, myUserId]);

    const activeGroups = tab === "mine" ? myGroups : discoverGroups;

    const handleJoin = async (group: Group) => {
        try {
            await requestToJoinGroup({ variables: { groupId: group._id } });
            toast.success(group.privacy === GroupPrivacy.PUBLIC ? dict.groups.joinedSuccess : dict.groups.requestSentSuccess);
            await refreshRequests();
        } catch {
            toast.error(dict.groups.joinError);
        }
    };

    return (
        <div className="pb-24">
            <div className="flex items-center gap-2 px-4 py-3">
                <h1 className="flex-1 text-[1.65rem] font-black tracking-[-0.04em]">{dict.groups.title}</h1>
                <CreateGroupDialog>
                    <button
                        type="button"
                        className="flex h-[34px] items-center gap-1.5 rounded-full bg-primary px-3.5 text-[13.5px] font-semibold text-primary-foreground"
                    >
                        <Plus className="size-[15px]" />
                        {dict.groups.createShort}
                    </button>
                </CreateGroupDialog>
            </div>

            <div className="flex px-4 border-b border-border">
                <button
                    type="button"
                    onClick={() => setTab("mine")}
                    className={cn(
                        "h-11 mr-5 text-[14.5px] font-medium",
                        tab === "mine" ? "font-semibold text-primary border-b-2 border-primary" : "text-muted-foreground"
                    )}
                >
                    {dict.groups.myGroups}
                </button>
                <button
                    type="button"
                    onClick={() => setTab("discover")}
                    className={cn(
                        "h-11 text-[14.5px] font-medium",
                        tab === "discover" ? "font-semibold text-primary border-b-2 border-primary" : "text-muted-foreground"
                    )}
                >
                    {dict.groups.discover}
                </button>
            </div>

            <div className="mt-2 min-h-[1px] border-y border-border bg-card">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-field" />)}
                    </div>
                ) : activeGroups.length === 0 ? (
                    <div className="py-10">
                        <EmptyState
                            icon={tab === "mine" ? Users : ShieldCheck}
                            title={tab === "mine" ? dict.groups.noGroups : dict.groups.discover}
                            description={tab === "mine" ? dict.groups.noGroupsDesc : dict.groups.noDiscoverGroups}
                        />
                    </div>
                ) : (
                    activeGroups.map((group) => (
                        <GroupRow
                            key={group._id}
                            group={group}
                            myUserId={myUserId}
                            pendingRequestGroupIds={pendingRequestGroupIds}
                            onJoin={handleJoin}
                            joining={joining}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

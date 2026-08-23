"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Globe, Plus } from "lucide-react";
import { useGroups } from "@/hooks/useData/useGroups";
import { useMe } from "@/hooks/useData/useUserData";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { Group, GroupMemberRole, GroupPrivacy } from "@/types/Group";
import { cn } from "@/lib/utils";

function privacyLabel(privacy: GroupPrivacy, dict: ReturnType<typeof useDictionary>) {
    switch (privacy) {
        case GroupPrivacy.PUBLIC: return dict.groups.form.public;
        case GroupPrivacy.PRIVATE: return dict.groups.form.private;
        case GroupPrivacy.SECRET: return dict.groups.form.secret;
    }
}

function GroupRow({ group, myUserId }: { group: Group; myUserId?: string }) {
    const dict = useDictionary();
    const myMembership = group.members?.find((m) => (m.user.id || (m.user as { _id?: string })._id) === myUserId);

    return (
        <Link href={`/groups/${group.slug}`} className="flex items-center gap-3 px-4 py-3.5 border-t border-border first:border-t-0">
            <Avatar shape="establishment" className="size-[50px] shrink-0">
                <AvatarFallback className="text-lg">{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-[15px] truncate">{group.name}</p>
                    {myMembership?.role === GroupMemberRole.ADMIN && (
                        <span className="shrink-0 text-2xs font-semibold text-primary-800 bg-primary-100 rounded-full px-1.5 py-0.5">
                            {dict.groups.roles.admin}
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {privacyLabel(group.privacy, dict)} · {group.members?.length ?? 0} {dict.groups.members.toLowerCase()}
                </p>
            </div>
        </Link>
    );
}

export default function GroupsListMobile() {
    const dict = useDictionary();
    const { me } = useMe();
    const { groups, loading } = useGroups({ limit: 50 });
    const [tab, setTab] = useState<"mine" | "discover">("mine");

    const myUserId = me?.id || (me as { _id?: string } | undefined)?._id;

    const { myGroups, discoverGroups } = useMemo(() => {
        const mine: Group[] = [];
        const discover: Group[] = [];
        for (const group of groups) {
            const isMember = group.members?.some((m) => (m.user.id || (m.user as { _id?: string })._id) === myUserId);
            if (isMember) mine.push(group);
            else if (group.privacy === GroupPrivacy.PUBLIC) discover.push(group);
        }
        return { myGroups: mine, discoverGroups: discover };
    }, [groups, myUserId]);

    const activeGroups = tab === "mine" ? myGroups : discoverGroups;

    return (
        <div className="pb-6">
            <div className="flex items-center gap-2 px-4 py-3">
                <h1 className="flex-1 text-xl font-bold font-heading">{dict.groups.title}</h1>
                <CreateGroupDialog>
                    <button
                        type="button"
                        className="flex items-center gap-1.5 h-[34px] px-3.5 rounded-button bg-primary text-primary-foreground text-[13.5px] font-semibold"
                    >
                        <Plus className="size-[15px]" />
                        {dict.groups.create}
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

            <div className="mt-2 bg-card border-y border-border min-h-[1px]">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-field" />)}
                    </div>
                ) : activeGroups.length === 0 ? (
                    <div className="py-10">
                        <EmptyState
                            icon={tab === "mine" ? Users : Globe}
                            title={tab === "mine" ? dict.groups.noGroups : dict.groups.discover}
                            description={tab === "mine" ? dict.groups.noGroupsDesc : dict.groups.noDiscoverGroups}
                        />
                    </div>
                ) : (
                    activeGroups.map((group) => (
                        <GroupRow key={group._id} group={group} myUserId={myUserId} />
                    ))
                )}
            </div>
        </div>
    );
}

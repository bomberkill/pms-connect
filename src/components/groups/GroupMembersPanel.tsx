"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useDictionary } from "@/hooks/use-dictionary";
import { GroupMemberRole, GroupMembership } from "@/types/Group";

interface GroupMembersPanelProps {
    members: GroupMembership[];
    currentUserId?: string;
    canManageMembers: boolean;
    canManageRoles: boolean;
    actionLoading: boolean;
    onRemoveMember: (userId: string) => Promise<void>;
    onRoleChange: (member: GroupMembership, role: GroupMemberRole) => Promise<void>;
}

function getMemberName(member: GroupMembership, fallback: string) {
    const user = member.user as {
        firstName?: string;
        lastName?: string;
        entityName?: string;
    };

    if (user.firstName || user.lastName) {
        return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    }

    return user.entityName || fallback;
}

export default function GroupMembersPanel({
    members,
    currentUserId,
    canManageMembers,
    canManageRoles,
    actionLoading,
    onRemoveMember,
    onRoleChange,
}: GroupMembersPanelProps) {
    const dict = useDictionary();
    const [memberToRemove, setMemberToRemove] = useState<{
        userId: string;
        name: string;
    } | null>(null);

    return (
        <>
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle>{dict.groups.members}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-6">
                    {members.map((member) => {
                        const memberUserId =
                            member.user.id ||
                            (member.user as { _id?: string })._id ||
                            "";
                        const isSelf = Boolean(currentUserId) && memberUserId === currentUserId;
                        const memberName = getMemberName(member, dict.groups.unknownMember);

                        return (
                            <div key={`${memberUserId}-${member.joinedAt}`} className="rounded-lg border p-3 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={member.user.profilePicUrl} />
                                            <AvatarFallback>
                                                {memberName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{memberName}</p>
                                            <p className="text-xs text-muted-foreground">{member.role}</p>
                                        </div>
                                    </div>
                                    {!isSelf && canManageMembers && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setMemberToRemove({ userId: memberUserId, name: memberName })}
                                            disabled={actionLoading}
                                        >
                                            {dict.groups.removeMember}
                                        </Button>
                                    )}
                                </div>

                                {canManageRoles && !isSelf && (
                                    <Select
                                        value={member.role}
                                        onValueChange={(role) => onRoleChange(member, role as GroupMemberRole)}
                                        disabled={actionLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={GroupMemberRole.ADMIN}>{dict.groups.roles.admin}</SelectItem>
                                            <SelectItem value={GroupMemberRole.MODERATOR}>{dict.groups.roles.moderator}</SelectItem>
                                            <SelectItem value={GroupMemberRole.MEMBER}>{dict.groups.roles.member}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={Boolean(memberToRemove)}
                onOpenChange={(open) => {
                    if (!open) {
                        setMemberToRemove(null);
                    }
                }}
                title={dict.groups.removeMemberConfirmTitle}
                message={
                    memberToRemove
                        ? dict.groups.removeMemberConfirmMessage.replace("{name}", memberToRemove.name)
                        : ""
                }
                confirmText={dict.groups.removeMember}
                onConfirm={async () => {
                    if (!memberToRemove) return;
                    await onRemoveMember(memberToRemove.userId);
                    setMemberToRemove(null);
                }}
            />
        </>
    );
}

"use client";

import React, { use } from "react";
import {
    useGroup,
    useGroupMutations,
    useGroupJoinRequests,
    useMyGroupJoinRequests,
    useMyGroupMembership,
} from "@/hooks/useData/useGroups";
import { useGroupMembers } from "@/hooks/useData/useGroupMembers";
import { GroupJoinRequestStatus, GroupMemberRole, GroupMembership } from "@/types/Group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MoreVertical, LogOut, Pencil, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/useData/useUserData";
import CreatePostComposerMobile from "@/components/CreatePostComposerMobile";
import { useDictionary } from "@/hooks/use-dictionary";
import { useGroupPosts } from "@/hooks/useData/usePostData";
import FeedItemCard from "@/components/FeedItemCard";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GroupMembersPanel from "@/components/groups/GroupMembersPanel";
import GroupJoinRequestsPanel from "@/components/groups/GroupJoinRequestsPanel";
import EditGroupDialog from "@/components/groups/EditGroupDialog";
import ConfirmationDialog from "@/components/ConfirmationDialog";

function GroupFeed({ groupId }: { groupId: string }) {
    const dict = useDictionary();
    const { posts, loading, loadMore } = useGroupPosts(groupId);

    if (loading && posts.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center p-8 border rounded-xl bg-card border-dashed">
                <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{dict.groups.noPosts}</p>
                <p className="text-sm text-muted-foreground">{dict.groups.beFirst}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <FeedItemCard key={post.id} item={post} />
            ))}
            <div className="flex justify-center p-4">
                <Button variant="ghost" onClick={() => loadMore()} disabled={loading}>
                    {loading ? dict.common.loading : dict.actions.loadMore}
                </Button>
            </div>
        </div>
    );
}

interface GroupDetailPageProps {
    params: Promise<{ slug: string }>;
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
    const dict = useDictionary();
    // Unwrap params using React.use()
    const { slug } = use(params);
    const { group, loading, error } = useGroup(slug);
    const {
        leaveGroup,
        requestToJoinGroup,
        acceptGroupInvitation,
        declineGroupInvitation,
        cancelGroupJoinRequest,
        approveGroupJoinRequest,
        rejectGroupJoinRequest,
        removeGroupMember,
        updateGroupMemberRole,
        deleteGroup,
        leaving,
        joining,
        acceptingInvitation,
        decliningInvitation,
        cancellingJoinRequest,
        approvingJoinRequest,
        rejectingJoinRequest,
        removingMember,
        updatingMemberRole,
        deleting,
    } = useGroupMutations();
    const router = useRouter();
    const { me } = useMe();
    const { members, membersCount, loading: membersLoading, refresh: refreshMembers } = useGroupMembers(group?._id || "");
    const { membership, refresh: refreshMembership } = useMyGroupMembership(group?._id);
    const { requests, refresh: refreshRequests } = useMyGroupJoinRequests({ groupId: group?._id, limit: 10 });
    const { requests: joinRequests, refresh: refreshJoinRequests } = useGroupJoinRequests({
        groupId: group?._id,
        status: GroupJoinRequestStatus.PENDING,
    });

    const activeRequest = requests.find((request) =>
        request.status === GroupJoinRequestStatus.PENDING ||
        request.status === GroupJoinRequestStatus.INVITED
    );
    const isMember = Boolean(membership);
    const isPendingRequest = activeRequest?.status === GroupJoinRequestStatus.PENDING;
    const isInvitation = activeRequest?.status === GroupJoinRequestStatus.INVITED;
    const canManageMembers =
        membership?.role === GroupMemberRole.ADMIN ||
        membership?.role === GroupMemberRole.MODERATOR;
    const canManageRequests =
        membership?.role === GroupMemberRole.ADMIN ||
        membership?.role === GroupMemberRole.MODERATOR;
    const canManageRoles = membership?.role === GroupMemberRole.ADMIN;
    const currentUserId = me?.id || (me as { _id?: string } | undefined)?._id;
    const creatorId =
        group?.creator?.id ||
        (group?.creator as { _id?: string } | undefined)?._id;
    const isCreator = Boolean(currentUserId && creatorId && currentUserId === creatorId);
    const actionLoading =
        leaving ||
        joining ||
        acceptingInvitation ||
        decliningInvitation ||
        cancellingJoinRequest ||
        approvingJoinRequest ||
        rejectingJoinRequest ||
        removingMember ||
        updatingMemberRole ||
        deleting;
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const refreshGroupState = async () => {
        await Promise.all([
            refreshMembership(),
            refreshRequests(),
            refreshJoinRequests(),
            refreshMembers(),
        ]);
        router.refresh();
    };

    const handleLeave = async () => {
        if (!group) return;
        try {
            await leaveGroup({ variables: { groupId: group._id } });
            toast.success(dict.groups.leftSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.leftError);
        }
    };

    const handleJoin = async () => {
        if (!group) return;
        try {
            await requestToJoinGroup({ variables: { groupId: group._id } });
            toast.success(
                group.privacy === "PUBLIC"
                    ? dict.groups.joinedSuccess
                    : dict.groups.requestSentSuccess
            );
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.joinError);
        }
    };

    const handleCancelRequest = async () => {
        if (!activeRequest) return;
        try {
            await cancelGroupJoinRequest({ variables: { input: { requestId: activeRequest.id } } });
            toast.success(dict.groups.requestCancelledSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.requestCancelledError);
        }
    };

    const handleAcceptInvitation = async () => {
        if (!activeRequest) return;
        try {
            await acceptGroupInvitation({ variables: { input: { requestId: activeRequest.id } } });
            toast.success(dict.groups.invitationAcceptedSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.invitationAcceptedError);
        }
    };

    const handleDeclineInvitation = async () => {
        if (!activeRequest) return;
        try {
            await declineGroupInvitation({ variables: { input: { requestId: activeRequest.id } } });
            toast.success(dict.groups.invitationDeclinedSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.invitationDeclinedError);
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        try {
            await approveGroupJoinRequest({ variables: { input: { requestId } } });
            toast.success(dict.groups.requestApprovedSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.requestApprovedError);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            await rejectGroupJoinRequest({ variables: { input: { requestId } } });
            toast.success(dict.groups.requestRejectedSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.requestRejectedError);
        }
    };

    const handleRemoveMember = async (memberUserId: string) => {
        if (!group) return;
        try {
            await removeGroupMember({ variables: { groupId: group._id, userId: memberUserId } });
            toast.success(dict.groups.memberRemovedSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.memberRemovedError);
        }
    };

    const handleRoleChange = async (member: GroupMembership, role: GroupMemberRole) => {
        if (!group) return;
        const memberUserId = member.user.id || (member.user as { _id?: string })._id;
        if (!memberUserId || member.role === role) return;

        try {
            await updateGroupMemberRole({
                variables: {
                    groupId: group._id,
                    updateGroupMemberRoleInput: {
                        userId: memberUserId,
                        role,
                    },
                },
            });
            toast.success(dict.groups.memberRoleUpdatedSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.memberRoleUpdatedError);
        }
    };

    const handleDeleteGroup = async () => {
        if (!group) return;
        try {
            await deleteGroup({ variables: { groupId: group._id } });
            toast.success(dict.groups.deleteSuccess);
            router.push("/groups");
            router.refresh();
        } catch {
            toast.error(dict.groups.deleteError);
        }
    };

    if (loading) {
        return (
            <div className="container max-w-4xl mx-auto p-4 space-y-6">
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="flex gap-4">
                    <Skeleton className="h-32 w-1/3 rounded-xl" />
                    <Skeleton className="h-32 w-2/3 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold text-red-500">{dict.groups.notFound}</h2>
                <Button onClick={() => router.push("/groups")} variant="link">
                    {dict.common.back}
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-5xl mx-auto pb-20">
            {/* Header / Cover */}
            <div className="relative h-48 md:h-64 bg-muted rounded-b-xl overflow-hidden mb-12">
                {group.coverImageUrl ? (
                    <Image src={group.coverImageUrl} alt="Cover" fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                )}

                {/* Profile Image Overlapping */}
                <div className="absolute -bottom-10 left-6 md:left-10">
                    <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-lg">
                        <AvatarImage src={group.profileImageUrl} />
                        <AvatarFallback className="text-3xl">{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="px-6 md:px-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="pt-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{group.name}</h1>
                    <div className="flex items-center text-muted-foreground mt-1">
                        <span className="flex items-center mr-4">
                            <Users className="w-4 h-4 mr-1" />
                            {dict.groups.privacy} &bull; {membersLoading ? '...' : membersCount} {dict.groups.members.toLowerCase()}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isInvitation ? (
                        <>
                            <Button variant="outline" onClick={handleDeclineInvitation} disabled={actionLoading}>
                                {dict.groups.declineInvitation}
                            </Button>
                            <Button onClick={handleAcceptInvitation} disabled={actionLoading}>
                                {dict.groups.acceptInvitation}
                            </Button>
                        </>
                    ) : isPendingRequest ? (
                        <Button variant="outline" onClick={handleCancelRequest} disabled={actionLoading}>
                            {dict.groups.cancelRequest}
                        </Button>
                    ) : isMember ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" disabled={actionLoading}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canManageRoles && (
                                    <EditGroupDialog group={group}>
                                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                            <Pencil className="mr-2 h-4 w-4" /> {dict.groups.edit}
                                        </DropdownMenuItem>
                                    </EditGroupDialog>
                                )}
                                {isCreator && (
                                    <DropdownMenuItem
                                        className="text-red-500 cursor-pointer"
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> {dict.groups.delete}
                                    </DropdownMenuItem>
                                )}
                                {!isCreator && (
                                    <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={handleLeave}>
                                        <LogOut className="mr-2 h-4 w-4" /> {dict.groups.leave}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={handleJoin} disabled={actionLoading}>
                            {dict.groups.join}
                        </Button>
                    )}
                </div>
            </div>

            <ConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title={dict.groups.deleteConfirmTitle}
                message={dict.groups.deleteConfirmMessage}
                confirmText={dict.groups.delete}
                onConfirm={handleDeleteGroup}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-8">
                {/* Left: Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle>{dict.groups.about}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-6">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {group.description || dict.profile.noBio}
                            </p>
                            <div className="pt-4 border-t flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{dict.groups.createdBy}</span>
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={group.creator.profilePicUrl} />
                                        <AvatarFallback>AD</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {'firstName' in group.creator ? `${group.creator.firstName} ${group.creator.lastName}` : (group.creator as any).entityName}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <GroupMembersPanel
                        members={members}
                        currentUserId={currentUserId}
                        canManageMembers={canManageMembers}
                        canManageRoles={Boolean(canManageRoles)}
                        actionLoading={actionLoading}
                        onRemoveMember={handleRemoveMember}
                        onRoleChange={handleRoleChange}
                    />

                    {canManageRequests && (
                        <GroupJoinRequestsPanel
                            requests={joinRequests}
                            actionLoading={actionLoading}
                            onApprove={handleApproveRequest}
                            onReject={handleRejectRequest}
                        />
                    )}
                </div>

                {/* Right: Feed */}
                <div className="md:col-span-2 space-y-6">
                    {isMember && (
                        <CreatePostComposerMobile groupId={group._id} />
                    )}

                    {/* Group Feed */}
                    <GroupFeed groupId={group._id} />
                </div>
            </div>
        </div>
    );
}

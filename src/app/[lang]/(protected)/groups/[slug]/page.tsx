"use client";

import React, { use } from "react";
import {
    useGroup,
    useGroupMutations,
    useGroupJoinRequests,
    useMyGroupJoinRequests,
    useMyGroupMembership,
    usePendingGroupPosts,
} from "@/hooks/useData/useGroups";
import { useGroupMembers } from "@/hooks/useData/useGroupMembers";
import { GroupJoinRequestStatus, GroupMemberRole, GroupMembership, GroupPrivacy } from "@/types/Group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock3, FileText, Users, MoreVertical, LogOut, Pencil, Trash2, UserPlus } from "lucide-react";
import { ResponsiveActionMenu, ResponsiveActionMenuItem } from "@/components/ui/responsive-action-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupMembersPanel from "@/components/groups/GroupMembersPanel";
import InviteMemberDialog from "@/components/groups/InviteMemberDialog";
import { useMutedAuthorIds } from "@/hooks/use-muted-authors";
import GroupJoinRequestsPanel from "@/components/groups/GroupJoinRequestsPanel";
import PendingGroupPostsPanel from "@/components/groups/PendingGroupPostsPanel";
import EditGroupDialog from "@/components/groups/EditGroupDialog";
import ConfirmationDialog from "@/components/ConfirmationDialog";

function privacyLabel(privacy: GroupPrivacy, dict: ReturnType<typeof useDictionary>) {
    switch (privacy) {
        case GroupPrivacy.PUBLIC: return dict.groups.form.public;
        case GroupPrivacy.PRIVATE: return dict.groups.form.private;
        case GroupPrivacy.SECRET: return dict.groups.form.secret;
    }
}

function GroupFeed({ groupId }: { groupId: string }) {
    const dict = useDictionary();
    const { posts, loading, loadMore } = useGroupPosts(groupId);
    const mutedAuthorIds = useMutedAuthorIds();
    const { me } = useMe();
    const blockedAuthorIds = me?.blockedUsers ?? [];
    const visiblePosts = posts.filter(
        (post) => !mutedAuthorIds.includes(post.author.id) && !blockedAuthorIds.includes(post.author.id)
    );

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
            {visiblePosts.map((post) => (
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
        updateGroup,
        deleteGroup,
        updating,
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
        approveGroupPost,
        rejectGroupPost,
        approvingPost,
        rejectingPost,
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
    const canModeratePosts =
        membership?.role === GroupMemberRole.ADMIN ||
        membership?.role === GroupMemberRole.MODERATOR;
    const { posts: pendingPosts, refresh: refreshPendingPosts } = usePendingGroupPosts(group?._id, canModeratePosts);

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
        updating ||
        deleting ||
        approvingPost ||
        rejectingPost;
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [editGroupOpen, setEditGroupOpen] = React.useState(false);

    const refreshGroupState = async () => {
        await Promise.all([
            refreshMembership(),
            refreshRequests(),
            refreshJoinRequests(),
            refreshMembers(),
            refreshPendingPosts(),
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

    const handleToggleGroupSetting = async (
        key: "postsRequireApproval" | "restrictToVerifiedTitles",
        checked: boolean
    ) => {
        if (!group) return;
        try {
            await updateGroup({
                variables: {
                    groupId: group._id,
                    updateGroupInput: {
                        [key]: checked,
                    },
                },
            });
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.form.updateError);
        }
    };

    const groupActionItems: ResponsiveActionMenuItem[] = [
        ...(canManageRoles
            ? [
                {
                    key: "edit",
                    label: dict.groups.edit,
                    icon: Pencil,
                    onSelect: () => setEditGroupOpen(true),
                },
            ]
            : []),
        ...(isCreator
            ? [
                {
                    key: "delete",
                    label: dict.groups.delete,
                    icon: Trash2,
                    destructive: true,
                    disabled: deleting,
                    onSelect: () => setDeleteDialogOpen(true),
                },
            ]
            : [
                {
                    key: "leave",
                    label: dict.groups.leave,
                    icon: LogOut,
                    destructive: true,
                    disabled: actionLoading,
                    onSelect: handleLeave,
                },
            ]),
    ];

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

    const handleApprovePost = async (postId: string) => {
        try {
            await approveGroupPost({ variables: { postId } });
            toast.success(dict.groups.postApprovedSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.postApprovedError);
        }
    };

    const handleRejectPost = async (postId: string) => {
        try {
            await rejectGroupPost({ variables: { postId } });
            toast.success(dict.groups.postRejectedSuccess);
            await refreshGroupState();
        } catch {
            toast.error(dict.groups.postRejectedError);
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
                <h2 className="text-xl font-bold text-destructive">{dict.groups.notFound}</h2>
                <Button onClick={() => router.push("/groups")} variant="link">
                    {dict.common.back}
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl pb-24">
            {/* Header / Cover */}
            <div className="relative h-40 overflow-hidden bg-muted md:h-64 md:rounded-b-xl">
                {group.coverImageUrl ? (
                    <Image src={group.coverImageUrl} alt="Cover" fill className="object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/18 via-secondary/12 to-tertiary/18 text-xs font-semibold text-muted-foreground">
                        {dict.groups.bannerPlaceholder}
                    </div>
                )}

                {/* Profile Image Overlapping */}
                <div className="absolute bottom-3 left-4 md:-bottom-10 md:left-10">
                    <Avatar shape="establishment" className="w-16 h-16 md:w-32 md:h-32 border-4 border-background shadow-lg">
                        <AvatarImage src={group.profileImageUrl} />
                        <AvatarFallback className="text-xl md:text-3xl">{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="mb-5 flex flex-col gap-4 px-4 pt-4 md:mb-6 md:flex-row md:items-center md:justify-between md:px-10 md:pt-12">
                <div className="min-w-0">
                    <h1 className="text-[1.45rem] font-black leading-tight tracking-[-0.04em] md:text-3xl">{group.name}</h1>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {privacyLabel(group.privacy, dict)} · {membersLoading ? '...' : membersCount} {dict.groups.memberCountLabel}
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {group.description || dict.profile.noBio}
                    </p>
                    {members.length > 0 && (
                        <p className="mt-2 text-xs font-medium text-muted-foreground">
                            {dict.groups.membersPreview.replace("{count}", String(Math.max(0, membersCount - 2)))}
                        </p>
                    )}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {isInvitation ? (
                        <>
                            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleDeclineInvitation} disabled={actionLoading}>
                                {dict.groups.declineInvitation}
                            </Button>
                            <Button className="flex-1 md:flex-none" onClick={handleAcceptInvitation} disabled={actionLoading}>
                                {dict.groups.acceptInvitation}
                            </Button>
                        </>
                    ) : isPendingRequest ? (
                        <Button variant="outline" className="flex-1 md:flex-none" onClick={handleCancelRequest} disabled={actionLoading}>
                            {dict.groups.cancelRequest}
                        </Button>
                    ) : isMember ? (
                        <>
                            <Button className="flex-1 rounded-full md:flex-none" onClick={() => document.getElementById("group-composer")?.scrollIntoView({ behavior: "smooth" })}>
                                <FileText className="h-4 w-4" />
                                {dict.button.publish}
                            </Button>
                            <Button variant="outline" className="flex-1 rounded-full md:flex-none" onClick={() => document.getElementById("group-members")?.scrollIntoView({ behavior: "smooth" })}>
                                <Users className="h-4 w-4" />
                                {dict.groups.membersShort}
                            </Button>
                            <EditGroupDialog group={group} open={editGroupOpen} onOpenChange={setEditGroupOpen}>
                                <span className="hidden" />
                            </EditGroupDialog>
                            <ResponsiveActionMenu
                                title={dict.common.actions}
                                items={groupActionItems}
                                trigger={
                                    <Button type="button" variant="outline" size="icon" className="rounded-full" disabled={actionLoading}>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                }
                            />
                        </>
                    ) : (
                        <Button className="flex-1 md:flex-none" onClick={handleJoin} disabled={actionLoading}>
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

            <div className="grid grid-cols-1 gap-5 px-4 md:grid-cols-3 md:gap-6 md:px-8">
                {/* Left: Info */}
                <div id="group-members" className="space-y-5 md:col-span-1 md:space-y-6">
                    <Card className="hidden md:block">
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

                    <section className="overflow-hidden rounded-[22px] border border-border bg-card shadow-xs md:rounded-card">
                        <div className="flex items-center gap-2 border-b border-border px-3 py-3 md:hidden">
                            <button
                                type="button"
                                className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
                                onClick={() => router.back()}
                                aria-label={dict.actions.back}
                            >
                                <ArrowLeft className="size-5" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">{dict.groups.membersHubTitle}</h2>
                                <p className="truncate text-[12.5px] text-muted-foreground">{group.name}</p>
                            </div>
                            {canManageMembers && (
                                <InviteMemberDialog
                                    groupId={group._id}
                                    existingMemberIds={members.map((m) => m.user.id).filter(Boolean) as string[]}
                                >
                                    <button type="button" className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted" aria-label={dict.groups.form.invite}>
                                        <UserPlus className="size-5" strokeWidth={1.9} />
                                    </button>
                                </InviteMemberDialog>
                            )}
                        </div>
                        <Tabs defaultValue={canManageRequests ? "requests" : "members"}>
                            <TabsList className="flex h-11 w-full justify-start rounded-none border-b border-border bg-card px-4 py-0">
                                {canManageRequests && (
                                    <TabsTrigger value="requests" className="mr-5 h-11 rounded-none px-0 data-[state=active]:shadow-[inset_0_-2.5px_0_hsl(var(--primary))]">
                                        {dict.groups.requestsTab}
                                        {joinRequests.length > 0 && (
                                            <span className="ml-1.5 rounded-full bg-tertiary-700 px-1.5 py-0.5 text-[12px] font-bold leading-none text-white">
                                                {joinRequests.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="members" className="mr-5 h-11 rounded-none px-0 data-[state=active]:shadow-[inset_0_-2.5px_0_hsl(var(--primary))]">
                                    {dict.groups.membersTab}
                                </TabsTrigger>
                                {canManageRoles && (
                                    <TabsTrigger value="roles" className="h-11 rounded-none px-0 data-[state=active]:shadow-[inset_0_-2.5px_0_hsl(var(--primary))]">
                                        {dict.groups.rolesTab}
                                    </TabsTrigger>
                                )}
                            </TabsList>
                            {canManageRequests && (
                                <TabsContent value="requests" className="m-0">
                                    {joinRequests.length > 0 && (
                                        <div className="flex items-center gap-2 border-b border-tertiary-200 bg-tertiary-50 px-4 py-3 text-tertiary-900 dark:border-tertiary-900 dark:bg-tertiary-950 dark:text-tertiary-100">
                                            <Clock3 className="size-4 shrink-0" strokeWidth={1.9} />
                                            <p className="min-w-0 flex-1 text-[13px] leading-snug">
                                                {dict.groups.pendingRequestsSummary.replace("{count}", String(joinRequests.length))}
                                            </p>
                                        </div>
                                    )}
                                    <GroupJoinRequestsPanel
                                        requests={joinRequests}
                                        actionLoading={actionLoading}
                                        onApprove={handleApproveRequest}
                                        onReject={handleRejectRequest}
                                    />
                                </TabsContent>
                            )}
                            <TabsContent value="members" className="m-0">
                                <div className="hidden border-b border-border p-4 md:block">
                                    {canManageMembers && (
                                        <InviteMemberDialog
                                            groupId={group._id}
                                            existingMemberIds={members.map((m) => m.user.id).filter(Boolean) as string[]}
                                        />
                                    )}
                                </div>
                                <GroupMembersPanel
                                    members={members}
                                    currentUserId={currentUserId}
                                    canManageMembers={canManageMembers}
                                    canManageRoles={Boolean(canManageRoles)}
                                    actionLoading={actionLoading}
                                    mode="members"
                                    onRemoveMember={handleRemoveMember}
                                    onRoleChange={handleRoleChange}
                                />
                            </TabsContent>
                            {canManageRoles && (
                                <TabsContent value="roles" className="m-0">
                                    <GroupMembersPanel
                                        members={members}
                                        currentUserId={currentUserId}
                                        canManageMembers={canManageMembers}
                                        canManageRoles={Boolean(canManageRoles)}
                                        actionLoading={actionLoading}
                                        mode="roles"
                                        onRemoveMember={handleRemoveMember}
                                        onRoleChange={handleRoleChange}
                                    />
                                </TabsContent>
                            )}
                        </Tabs>
                    </section>

                    {canModeratePosts && (
                        <PendingGroupPostsPanel
                            group={group}
                            posts={pendingPosts}
                            actionLoading={actionLoading}
                            settingsLoading={actionLoading}
                            canDelete={isCreator}
                            onApprove={handleApprovePost}
                            onReject={handleRejectPost}
                            onTogglePostsRequireApproval={(checked) => handleToggleGroupSetting("postsRequireApproval", checked)}
                            onToggleRestrictToVerifiedTitles={(checked) => handleToggleGroupSetting("restrictToVerifiedTitles", checked)}
                            onOpenSettings={() => setEditGroupOpen(true)}
                            onDeleteGroup={() => setDeleteDialogOpen(true)}
                        />
                    )}
                </div>

                {/* Right: Feed */}
                <div className="space-y-5 md:col-span-2 md:space-y-6">
                    {isMember && (
                        <div id="group-composer">
                            <CreatePostComposerMobile groupId={group._id} />
                        </div>
                    )}

                    {/* Group Feed */}
                    <GroupFeed groupId={group._id} />
                </div>
            </div>
        </div>
    );
}

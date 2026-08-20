"use client"

import { useDictionary } from "@/hooks/use-dictionary"
import { useNotification } from "@/hooks/use-notification"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Camera, MessageCircle, UserMinus, MoreHorizontal, Ban, Flag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MAX_FILE_SIZE, uploadFileToR2, deleteUploadedFile } from "@/utils/fileUpload"
import { updateUser } from "@/graphql/authActions"
import React, { useEffect, useMemo, useState } from "react"
import ConfirmationDialog from "@/components/ConfirmationDialog"
import UpdateProfileDialog from "@/components/UpdateProfileDialog"
import CustomLoader from "@/components/Loader"
import { UserTypeGQL } from "@/types/User"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PUBLIC_PROFILE_FIELDS } from "@/graphql/queries/user"

function extractR2Key(publicUrl: string): string {
  const base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  if (!base || !publicUrl.startsWith(`${base}/`)) {
    throw new Error("Invalid R2 public URL");
  }
  return publicUrl.slice(base.length + 1);
}
import { useConnectionActions, useConnectionRequests, useConnectionRequestUpdatedSubscription, useFollowActions, useFollowsSubscription, useMe, useUserBySlug } from "@/hooks/useData/index"
import { ConnectionRequestStatus } from "@/types/ConnectionRequest"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUserPosts } from "@/hooks/useData/usePostData"
import FeedItemCard from "@/components/FeedItemCard"
import { EmptyState } from "@/components/ui/empty-state"
import { useUserCounts } from "@/hooks/useData/useUserCounts"

export default function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const dict = useDictionary()
  const { open } = useNotification()
  const { slug } = React.use(params);

  const { loading: authUserLoading, me: authUser, refetch: refetchMe } = useMe();
  const isOwnProfile = useMemo(() => !!slug && slug === authUser?.slug, [slug, authUser?.slug]);
  const shouldFetchOtherProfile = !!slug && !authUserLoading && !isOwnProfile;

  const { user: otherUser, loading: otherUserLoading } = useUserBySlug(
    shouldFetchOtherProfile ? slug : '',
    { fields: PUBLIC_PROFILE_FIELDS }
  );

  const profileUser = isOwnProfile ? authUser : (otherUser ?? null);
  const loading = authUserLoading || (shouldFetchOtherProfile && otherUserLoading);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsUserId = profileUser?.id || (profileUser as any)?._id || authUser?.id || (authUser as any)?._id || '';
  const { posts: userPostsForCount } = useUserPosts(statsUserId);
  const { followersCount, followingCount, postsCount, loading: statsLoading } = useUserCounts(
    statsUserId,
    userPostsForCount?.length || 0
  );

  const [isUploading, setIsUploading] = useState(false)
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "profile" | "cover"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      open("info", dict.notifications.warning, { message: dict.validation.file.onlyPng });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      open("info", dict.notifications.warning, { message: dict.validation.file.tooLarge });
      return;
    }

    setDialogConfig({
      isOpen: true,
      title: dict.profile.confirmUpdate.title,
      message: field === "profile" ? dict.profile.confirmUpdate.messageProfile : dict.profile.confirmUpdate.messageCover,
      onConfirm: async () => {
        setDialogConfig((prev) => ({ ...prev, isOpen: false }));
        setIsUploading(true);

        let uploadedKey: string | undefined;
        try {
          const uploadedFile = await uploadFileToR2(file, field === "profile" ? "AVATAR" : "COVER_PICTURE");
          if (!uploadedFile) return;

          uploadedKey = uploadedFile.key;
          const fieldToUpdate = field === "profile" ? "profilePicUrl" : "coverPicUrl";

          await updateUser({ [fieldToUpdate]: uploadedFile.publicUrl });

          open("success", dict.notifications.profileUpdated.title, {
            message: dict.notifications.profileUpdated.message,
          });

          const publicUrl = field === "profile" ? authUser?.profilePicUrl : authUser?.coverPicUrl;
          if (publicUrl) {
            try {
              await deleteUploadedFile(extractR2Key(publicUrl));
            } catch (removeErr) {
              console.error("Erreur suppression :", removeErr);
            }
          }
        } catch (error) {
          console.error("error:", error);
          try {
            if (uploadedKey) {
              await deleteUploadedFile(uploadedKey);
            }
          } catch (err) {
            console.error("Rollback R2 failed:", err);
          }
        } finally {
          setIsUploading(false);
        }
      },
      onCancel: () => {
        setDialogConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- LOGIQUE DE SUIVI ET DE CONNEXION ---
  const isFollowing = authUser?.following?.includes(profileUser?.id ?? '');
  const isConnected = authUser?.connections?.includes(profileUser?.id ?? '');
  const { requests, refetch: refetchRequests } = useConnectionRequests(ConnectionRequestStatus.PENDING);
  const pendingRequest = requests?.find(req => (req.requester.id === profileUser?.id || req.recipient.id === profileUser?.id));
  const { followUser, unfollowUser } = useFollowActions();
  const { sendRequest, removeConnection, acceptRequest, declineRequest } = useConnectionActions();
  const { followsUpdated } = useFollowsSubscription(profileUser?.id ?? '');
  const { updatedRequest } = useConnectionRequestUpdatedSubscription();

  useEffect(() => {
    if (followsUpdated) {
      if (followsUpdated.follower.userId === authUser?.id || followsUpdated.following.userId === authUser?.id) {
        refetchMe();
        return;
      }
    }
  }, [followsUpdated, authUser?.id, refetchMe])

  useEffect(() => {
    if (updatedRequest) {
      refetchRequests();
    }
  }, [updatedRequest, refetchRequests]);

  const renderConnectionButton = () => {
    if (!profileUser) return null;
    if (pendingRequest) {
      if (pendingRequest.recipient.id === profileUser.id) {
        return (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => declineRequest({ variables: { requestId: pendingRequest.id } })}>
            {dict.actions.cancelRequest}
          </Button>
        );
      }
      return (
        <Button size="sm" onClick={() => acceptRequest({ variables: { requestId: pendingRequest.id } })}>
          {dict.actions.acceptRequest}
        </Button>
      );
    }
    if (isConnected) {
      return (
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeConnection({ variables: { userIdB: profileUser.id } })}>
          {dict.actions.disconnect}
        </Button>
      );
    }
    return (
      <Button variant="outline" size="sm" onClick={() => sendRequest({ variables: { recipientId: profileUser.id } })}>
        {dict.actions.connect}
      </Button>
    );
  };

  // Skeleton view
  if (loading || !profileUser) {
    return (
      <div className="bg-background min-h-screen">
        <Skeleton className="w-full h-40 md:h-56 rounded-none" />
        <div className="max-w-3xl mx-auto px-4 -mt-12 relative flex flex-col items-center">
          <Skeleton className="w-24 h-24 rounded-full border-4 border-background" />
          <Skeleton className="w-48 h-6 mt-4 rounded-full" />
          <Skeleton className="w-64 h-4 mt-2 rounded-full" />
          <div className="mt-10 w-full">
            <Skeleton className="w-full h-10 mb-6 rounded-full" />
            <Skeleton className="w-full h-20 mb-4 rounded-2xl" />
            <Skeleton className="w-full h-20 mb-4 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const displayName = profileUser.userType === UserTypeGQL.INDIVIDUAL
    ? `${profileUser.firstName} ${profileUser.lastName}`
    : profileUser.entityName;

  const initials = profileUser.userType === UserTypeGQL.INDIVIDUAL
    ? `${profileUser.firstName?.[0] ?? ""}${profileUser.lastName?.[0] ?? ""}`
    : profileUser.entityName?.[0];

  return (
    <div className="relative bg-background md:m-5 pb-5 min-h-screen md:rounded-2xl md:border md:shadow-xs">
      {isUploading && <CustomLoader />}

      {/* Cover — a gradient placeholder keeps the avatar's negative margin from
          sitting on nothing when the user hasn't uploaded one. */}
      <div className="relative w-full h-40 md:h-56">
        {profileUser.coverPicUrl ? (
          <Image
            src={profileUser.coverPicUrl}
            alt="Cover"
            fill
            className="object-cover md:rounded-t-2xl"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 md:rounded-t-2xl" />
        )}

        {isOwnProfile && (
          <>
            <label htmlFor="coverPicFile">
              <div className="absolute top-4 right-4 size-10 rounded-full bg-white/85 backdrop-blur-sm border border-neutral-300 shadow-xs flex items-center justify-center cursor-pointer hover:bg-white">
                <Camera className="w-5 h-5 text-neutral-700" />
              </div>
            </label>
            <Input
              id="coverPicFile"
              name="coverPicFile"
              type="file"
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={(event) => handleFileChange(event, "cover")}
            />
          </>
        )}
      </div>

      {/* Profile info */}
      <div className="max-w-3xl mx-auto px-4 -mt-10 md:-mt-12 relative">
        <div className="flex justify-between items-end gap-3">
          <div className="min-w-0">
            <div className="relative group size-20 md:size-24">
              <Avatar className="h-full w-full border-4 border-background shadow-xs">
                <AvatarImage
                  className="object-cover"
                  src={profileUser.profilePicUrl}
                  alt={displayName}
                />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <label htmlFor="profilePicFile">
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </label>
                  <Input
                    id="profilePicFile"
                    name="profilePicFile"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={(event) => handleFileChange(event, "profile")}
                  />
                </>
              )}
            </div>

            <h1 className="text-lg font-bold mt-2 truncate">{displayName}</h1>

            <p className="text-sm text-muted-foreground truncate">
              {profileUser.userType === UserTypeGQL.INDIVIDUAL
                ? profileUser.professionalTitle || ""
                : profileUser.entityType}
            </p>

            {profileUser.websiteUrl && (
              <a
                href={profileUser.websiteUrl.startsWith("http") ? profileUser.websiteUrl : `https://${profileUser.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm underline-offset-4 hover:underline"
              >
                {profileUser.websiteUrl}
              </a>
            )}
          </div>

          {isOwnProfile ? (
            <UpdateProfileDialog user={profileUser}>
              <Button size="sm">{dict.button.edit}</Button>
            </UpdateProfileDialog>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              {isFollowing ? (
                <Button variant="outline" size="sm" onClick={async () => { await unfollowUser({ variables: { userId: profileUser.id } }); }}>
                  {dict.actions.unfollow}
                </Button>
              ) : (
                <Button size="sm" onClick={async () => { await followUser({ variables: { userId: profileUser.id } }); }}>
                  {dict.actions.follow}
                </Button>
              )}
              {renderConnectionButton()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label={dict.common.actions} size="icon" variant="ghost" className="text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem className="cursor-pointer"><Ban className="mr-2 h-4 w-4" /> {dict.actions.mute}</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer"><Flag className="mr-2 h-4 w-4" /> {dict.actions.report}</DropdownMenuItem>
                  {isConnected && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => removeConnection({ variables: { userIdB: profileUser.id } })}>
                        <UserMinus className="mr-2 h-4 w-4" /> {dict.actions.disconnect}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Tabs — only About/Posts are implemented; Experience/Activity were
            declared but rendered nothing, so they're dropped rather than left
            as dead ends. */}
        <Tabs defaultValue="about" className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">{dict.profile.tabs.about}</TabsTrigger>
            <TabsTrigger value="posts">{dict.profile.tabs.posts}</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6 space-y-8">
            <section>
              <h2 className="text-sm font-semibold mb-2">{dict.profile.tabs.about}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {profileUser.bio || dict.profile.noBio}
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold mb-3">{dict.profile.stats.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile value={profileUser.connections.length} label={dict.common.relations} />
                <StatTile value={statsLoading ? '—' : postsCount} label={dict.profile.stats.posts} />
                <StatTile value={statsLoading ? '—' : followersCount} label={dict.profile.stats.followers} />
                <StatTile value={statsLoading ? '—' : followingCount} label={dict.profile.stats.following} />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <UserPostsFeed userId={profileUser.id} dict={dict} />
          </TabsContent>
        </Tabs>
      </div>
      <ConfirmationDialog
        open={dialogConfig.isOpen}
        onOpenChange={(isOpen) => setDialogConfig((prev) => ({ ...prev, isOpen }))}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
        title={dialogConfig.title}
        message={dialogConfig.message}
      />
    </div>
  )
}

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-muted/50 py-4">
      <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
      <span className="text-xs text-muted-foreground font-medium text-center">{label}</span>
    </div>
  );
}

function UserPostsFeed({ userId, dict }: { userId: string, dict: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { posts, loading, loadMore } = useUserPosts(userId);

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title={dict.profile.posts.emptyTitle || "No posts"}
        description={dict.profile.posts.emptyDesc || "This user hasn't posted anything yet."}
        icon={MessageCircle}
      />
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <FeedItemCard key={post.id} item={post} />
      ))}
      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={() => loadMore()} disabled={loading}>
          {loading ? dict.common.loading : dict.common.loadMore || "Load more"}
        </Button>
      </div>
    </div>
  )
}

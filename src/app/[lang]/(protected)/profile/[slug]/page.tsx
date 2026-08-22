"use client"

import { useDictionary } from "@/hooks/use-dictionary"
import { useNotification } from "@/hooks/use-notification"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Camera, MessageCircle, UserMinus, MoreHorizontal, Ban, Flag, ArrowLeft, Share2, CheckCircle2, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MAX_FILE_SIZE, uploadFileToR2, deleteUploadedFile } from "@/utils/fileUpload"
import { updateUser } from "@/graphql/authActions"
import React, { useEffect, useMemo, useState } from "react"
import ConfirmationDialog from "@/components/ConfirmationDialog"
import ReportDialog from "@/components/ReportDialog"
import UpdateProfileDialog from "@/components/UpdateProfileDialog"
import CustomLoader from "@/components/Loader"
import { AccountStatusGQL, UserTypeGQL } from "@/types/User"
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
  const router = useRouter()
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
  const [isReportOpen, setIsReportOpen] = useState(false)
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

  const handleShare = async (displayName: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: displayName, url });
      } catch {
        // User cancelled the native share sheet — not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      open("success", dict.notifications.linkCopied.title, {
        message: dict.notifications.linkCopied.message,
      });
    } catch (error) {
      console.error("Clipboard write failed:", error);
    }
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
          <Button variant="outline" className="flex-1 h-11 rounded-button text-destructive hover:text-destructive" onClick={() => declineRequest({ variables: { requestId: pendingRequest.id } })}>
            {dict.actions.cancelRequest}
          </Button>
        );
      }
      return (
        <Button className="flex-1 h-11 rounded-button gap-1.5" onClick={() => acceptRequest({ variables: { requestId: pendingRequest.id } })}>
          <UserPlus className="size-4" />
          {dict.actions.acceptRequest}
        </Button>
      );
    }
    if (isConnected) {
      return (
        <Button variant="outline" className="flex-1 h-11 rounded-button text-destructive hover:text-destructive" onClick={() => removeConnection({ variables: { userIdB: profileUser.id } })}>
          {dict.actions.disconnect}
        </Button>
      );
    }
    return (
      <Button className="flex-1 h-11 rounded-button gap-1.5" onClick={() => sendRequest({ variables: { recipientId: profileUser.id } })}>
        <UserPlus className="size-4" />
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

  const isEstablishment = profileUser.userType === UserTypeGQL.LEGAL_ENTITY;
  const isVerified = profileUser.accountStatus === AccountStatusGQL.ACTIVE;

  const displayName = profileUser.userType === UserTypeGQL.INDIVIDUAL
    ? `${profileUser.firstName} ${profileUser.lastName}`
    : profileUser.entityName;

  const initials = profileUser.userType === UserTypeGQL.INDIVIDUAL
    ? `${profileUser.firstName?.[0] ?? ""}${profileUser.lastName?.[0] ?? ""}`
    : profileUser.entityName?.[0];

  const locationLabel = [profileUser.location?.city, profileUser.location?.country]
    .filter(Boolean)
    .join(", ");

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

        <button
          type="button"
          aria-label={dict.actions.back}
          onClick={() => router.back()}
          className="absolute top-4 left-4 size-10 rounded-full bg-white/85 backdrop-blur-sm border border-neutral-300 shadow-xs flex items-center justify-center cursor-pointer hover:bg-white md:hidden"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-700" />
        </button>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwnProfile ? (
            <>
              <label htmlFor="coverPicFile">
                <div className="size-10 rounded-full bg-white/85 backdrop-blur-sm border border-neutral-300 shadow-xs flex items-center justify-center cursor-pointer hover:bg-white">
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
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={dict.common.actions}
                  className="size-10 rounded-full bg-white/85 backdrop-blur-sm border border-neutral-300 shadow-xs flex items-center justify-center cursor-pointer hover:bg-white"
                >
                  <MoreHorizontal className="h-4 w-4 text-neutral-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="cursor-pointer"><Ban className="mr-2 h-4 w-4" /> {dict.actions.mute}</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsReportOpen(true)}><Flag className="mr-2 h-4 w-4" /> {dict.actions.report}</DropdownMenuItem>
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
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="max-w-3xl mx-auto px-4 -mt-10 md:-mt-12 relative">
        <div className="relative group size-20 md:size-24">
          <Avatar shape={isEstablishment ? "establishment" : "person"} className="h-full w-full border-4 border-background shadow-xs">
            <AvatarImage
              className="object-cover"
              src={profileUser.profilePicUrl}
              alt={displayName}
            />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          {isVerified && (
            <div className="absolute -right-0.5 bottom-0 size-6 rounded-full bg-secondary-600 border-2 border-background flex items-center justify-center">
              <CheckCircle2 className="size-3.5 text-white" fill="currentColor" />
            </div>
          )}
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

        <div className="pt-2.5 flex flex-col gap-0.5">
          <h1 className="text-lg font-bold truncate">{displayName}</h1>

          {profileUser.userType === UserTypeGQL.INDIVIDUAL ? (
            <p className="text-sm text-foreground truncate">{profileUser.professionalTitle || ""}</p>
          ) : (
            <p className="text-sm text-foreground truncate">{dict.entityTypes[profileUser.entityType]}</p>
          )}

          {locationLabel && (
            <p className="text-sm text-muted-foreground truncate">{locationLabel}</p>
          )}

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

          {(isVerified || profileUser.userType === UserTypeGQL.INDIVIDUAL) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {isVerified && (
                <Badge variant="verified">
                  <CheckCircle2 className="size-3" />
                  {isEstablishment ? dict.profile.verifiedOrganization : dict.profile.verifiedIndividual}
                </Badge>
              )}
              {profileUser.userType === UserTypeGQL.INDIVIDUAL && (
                <Badge variant="primary">{dict.specialities[profileUser.speciality]}</Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats row — a plain divided strip, not boxed tiles, matching the
            mockup. Establishments only get real, countable stats (no fake
            "practitioners" headcount — nothing in the schema tracks that). */}
        <div className="flex mt-4 border-t border-b border-border">
          {!isEstablishment && (
            <StatCell value={profileUser.connections.length} label={dict.common.relations} />
          )}
          <StatCell value={statsLoading ? '—' : postsCount} label={dict.profile.stats.posts} />
          <StatCell value={statsLoading ? '—' : followersCount} label={dict.profile.stats.followers} />
          {!isEstablishment && (
            <StatCell value={statsLoading ? '—' : followingCount} label={dict.profile.stats.following} />
          )}
        </div>

        <div className="flex gap-2.5 mt-3.5">
          {isOwnProfile ? (
            <>
              <UpdateProfileDialog user={profileUser}>
                <Button variant="outline" className="flex-1 h-11 rounded-button gap-1.5">
                  <Camera className="size-4" />
                  {dict.button.edit}
                </Button>
              </UpdateProfileDialog>
              <Button variant="outline" className="flex-1 h-11 rounded-button gap-1.5" onClick={() => handleShare(displayName)}>
                <Share2 className="size-4" />
                {dict.actions.share}
              </Button>
            </>
          ) : isEstablishment ? (
            <>
              {isFollowing ? (
                <Button variant="outline" className="flex-1 h-11 rounded-button" onClick={async () => { await unfollowUser({ variables: { userId: profileUser.id } }); }}>
                  {dict.actions.unfollow}
                </Button>
              ) : (
                <Button className="flex-1 h-11 rounded-button" onClick={async () => { await followUser({ variables: { userId: profileUser.id } }); }}>
                  {dict.actions.follow}
                </Button>
              )}
              <Button variant="outline" className="flex-1 h-11 rounded-button" onClick={() => router.push('/chat')}>
                {dict.actions.contact}
              </Button>
            </>
          ) : (
            <>
              {renderConnectionButton()}
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-button"
                onClick={async () => {
                  if (isFollowing) await unfollowUser({ variables: { userId: profileUser.id } });
                  else await followUser({ variables: { userId: profileUser.id } });
                }}
              >
                {isFollowing ? dict.actions.unfollow : dict.actions.follow}
              </Button>
            </>
          )}
        </div>

        {/* Tabs — Publications first (matches the mockup's default), then
            About+Accreditations. "Expérience" (work history) and "Activité"
            aren't real tabs: no work-history entity exists in the API, and
            there's no activity-log endpoint to back a third tab — see
            profile pass notes for the full reasoning. */}
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">{dict.profile.tabs.posts}</TabsTrigger>
            <TabsTrigger value="about">{dict.profile.tabs.about}</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <UserPostsFeed userId={profileUser.id} dict={dict} />
          </TabsContent>

          <TabsContent value="about" className="mt-6 space-y-8">
            <section>
              <h2 className="text-sm font-semibold mb-2">{dict.profile.tabs.about}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {profileUser.bio || dict.profile.noBio}
              </p>
            </section>

            {profileUser.professionalAccreditation && profileUser.professionalAccreditation.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-3">{dict.profile.accreditations}</h2>
                <div className="flex flex-col gap-3">
                  {profileUser.professionalAccreditation.map((accreditation, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="size-9 rounded-field bg-secondary-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="size-4 text-secondary-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {accreditation.issuingAuthority || accreditation.accreditationType}
                        </p>
                        {accreditation.referenceNumber && (
                          <p className="text-xs font-mono text-muted-foreground truncate">{accreditation.referenceNumber}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
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
      {profileUser && (
        <ReportDialog open={isReportOpen} onOpenChange={setIsReportOpen} reportedUserId={profileUser.id} />
      )}
    </div>
  )
}

function StatCell({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex-1 py-2.5 flex flex-col gap-0.5">
      <p className="text-base font-bold text-foreground tabular-nums">{value}</p>
      <span className="text-2xs text-muted-foreground font-medium">{label}</span>
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

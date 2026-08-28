"use client"

import { useDictionary } from "@/hooks/use-dictionary"
import { useNotification } from "@/hooks/use-notification"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Activity, BriefcaseBusiness, Building2, Camera, ClipboardCheck, MapPin, MessageCircle, MessageSquareText, ThumbsUp, UserMinus, MoreHorizontal, Ban, Flag, ArrowLeft, Share2, CheckCircle2, UserPlus, ShieldOff, Plus, Pencil, Trash2, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MAX_FILE_SIZE, uploadFileToR2, deleteUploadedFile } from "@/utils/fileUpload"
import { updateUser } from "@/graphql/authActions"
import React, { useEffect, useMemo, useState } from "react"
import ConfirmationDialog from "@/components/ConfirmationDialog"
import ReportDialog from "@/components/ReportDialog"
import { muteAuthor } from "@/lib/muted-authors"
import UpdateProfileDialog from "@/components/UpdateProfileDialog"
import CustomLoader from "@/components/Loader"
import { AccountStatusGQL, User, UserTypeGQL } from "@/types/User"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PUBLIC_PROFILE_FIELDS } from "@/graphql/queries/user"
import { cn } from "@/lib/utils"

function extractR2Key(publicUrl: string): string {
  const base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  if (!base || !publicUrl.startsWith(`${base}/`)) {
    throw new Error("Invalid R2 public URL");
  }
  return publicUrl.slice(base.length + 1);
}
import { useConnectionActions, useConnectionRequests, useConnectionRequestUpdatedSubscription, useFollowActions, useBlockActions, useFollowsSubscription, useMe, useUserBySlug, useGetOrCreateConversationWithUser, useProfessionalExperiences } from "@/hooks/useData/index"
import { ConnectionRequestStatus } from "@/types/ConnectionRequest"
import { ResponsiveActionMenu, ResponsiveActionMenuItem } from "@/components/ui/responsive-action-menu"
import { useUserPosts } from "@/hooks/useData/usePostData"
import FeedItemCard from "@/components/FeedItemCard"
import { EmptyState } from "@/components/ui/empty-state"
import { useUserCounts } from "@/hooks/useData/useUserCounts"
import { ProfessionalExperience } from "@/types/User"
import ProfessionalExperienceDialog from "@/components/profile/ProfessionalExperienceDialog"

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
  const {
    professionalExperiences,
    loading: professionalExperiencesLoading,
    addProfessionalExperience,
    adding: addingProfessionalExperience,
    updateProfessionalExperience,
    updating: updatingProfessionalExperience,
    removeProfessionalExperience,
    removing: removingProfessionalExperience,
  } = useProfessionalExperiences(statsUserId);

  const [isUploading, setIsUploading] = useState(false)
  const [showCompactHeader, setShowCompactHeader] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false)
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
  const isBlocked = !!(profileUser?.id && authUser?.blockedUsers?.includes(profileUser.id));
  const { requests, refetch: refetchRequests } = useConnectionRequests(ConnectionRequestStatus.PENDING);
  const pendingRequest = requests?.find(req => (req.requester.id === profileUser?.id || req.recipient.id === profileUser?.id));
  const { followUser, unfollowUser } = useFollowActions();
  const { blockUser, unblockUser, blocking, unblocking } = useBlockActions();
  const { getOrCreateConversationWithUser } = useGetOrCreateConversationWithUser();

  const handleMessage = async () => {
    if (!profileUser) return;
    try {
      const { data } = await getOrCreateConversationWithUser({ variables: { userId: profileUser.id } });
      const conversationId = data?.getOrCreateConversationWithUser?.id;
      if (conversationId) router.push(`/chat/${conversationId}`);
    } catch (e) {
      console.error("Failed to open conversation", e);
    }
  };
  const { sendRequest, removeConnection, acceptRequest, declineRequest } = useConnectionActions();

  const handleBlockConfirm = async () => {
    if (!profileUser) return;
    try {
      await blockUser({ variables: { userId: profileUser.id } });
      setIsBlockConfirmOpen(false);
      open("success", dict.post.blockedTitle, { message: dict.post.blockedMessage });
    } catch (e) {
      console.error("Block failed", e);
    }
  };

  const handleUnblock = async () => {
    if (!profileUser) return;
    try {
      await unblockUser({ variables: { userId: profileUser.id } });
    } catch (e) {
      console.error("Unblock failed", e);
    }
  };
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

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 220;
      setShowCompactHeader((current) => (current === shouldShow ? current : shouldShow));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderConnectionButton = () => {
    if (!profileUser) return null;
    if (pendingRequest) {
      if (pendingRequest.recipient.id === profileUser.id) {
        return (
          <Button variant="outline" className="flex-1 h-11 min-w-0 rounded-button text-destructive hover:text-destructive" onClick={() => declineRequest({ variables: { requestId: pendingRequest.id } })}>
            <span className="min-w-0 truncate">{dict.actions.cancelRequest}</span>
          </Button>
        );
      }
      return (
        <Button className="flex-1 h-11 min-w-0 rounded-button gap-1.5" onClick={() => acceptRequest({ variables: { requestId: pendingRequest.id } })}>
          <UserPlus className="size-4 shrink-0" />
          <span className="min-w-0 truncate">{dict.actions.acceptRequest}</span>
        </Button>
      );
    }
    if (isConnected) {
      return (
        <Button variant="outline" className="flex-1 h-11 min-w-0 rounded-button text-destructive hover:text-destructive" onClick={() => removeConnection({ variables: { userIdB: profileUser.id } })}>
          <span className="min-w-0 truncate">{dict.actions.disconnect}</span>
        </Button>
      );
    }
    return (
      <Button className="flex-1 h-11 min-w-0 rounded-button gap-1.5" onClick={() => sendRequest({ variables: { recipientId: profileUser.id } })}>
        <UserPlus className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{dict.actions.connect}</span>
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
            <Skeleton className="w-full h-20 mb-4 rounded-card" />
            <Skeleton className="w-full h-20 mb-4 rounded-card" />
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

  const completion = getProfileCompletion(profileUser, professionalExperiences, dict);

  const compactPrimaryLabel = isOwnProfile
    ? null
    : isEstablishment
      ? (isFollowing ? dict.actions.unfollow : dict.actions.follow)
      : isConnected
        ? dict.actions.message
        : pendingRequest
          ? (pendingRequest.recipient.id === profileUser.id ? dict.actions.cancelRequest : dict.actions.acceptRequest)
          : dict.actions.connect;

  const handleCompactPrimaryAction = async () => {
    if (!profileUser || isOwnProfile) return;

    if (isEstablishment) {
      if (isFollowing) await unfollowUser({ variables: { userId: profileUser.id } });
      else await followUser({ variables: { userId: profileUser.id } });
      return;
    }

    if (isConnected) {
      await handleMessage();
      return;
    }

    if (pendingRequest) {
      if (pendingRequest.recipient.id === profileUser.id) {
        await declineRequest({ variables: { requestId: pendingRequest.id } });
      } else {
        await acceptRequest({ variables: { requestId: pendingRequest.id } });
      }
      return;
    }

    await sendRequest({ variables: { recipientId: profileUser.id } });
  };

  const profileActionItems: ResponsiveActionMenuItem[] = [
    {
      key: "mute",
      label: dict.actions.mute,
      icon: Ban,
      onSelect: () => {
        muteAuthor(profileUser.id);
        open("success", dict.post.mutedTitle, { message: dict.post.mutedMessage });
      },
    },
    {
      key: "report",
      label: dict.actions.report,
      icon: Flag,
      onSelect: () => setIsReportOpen(true),
    },
    {
      key: "block",
      label: isBlocked ? dict.actions.unblock : dict.actions.block,
      icon: ShieldOff,
      destructive: true,
      disabled: blocking || unblocking,
      onSelect: isBlocked ? handleUnblock : () => setIsBlockConfirmOpen(true),
    },
    ...(isConnected
      ? [
        {
          key: "disconnect",
          label: dict.actions.disconnect,
          icon: UserMinus,
          destructive: true,
          separatorBefore: true,
          onSelect: () => removeConnection({ variables: { userIdB: profileUser.id } }),
        },
      ]
      : []),
  ];

  return (
    <div className="relative bg-background md:m-5 pb-5 min-h-screen md:rounded-2xl md:border md:shadow-xs">
      {isUploading && <CustomLoader />}

      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 shadow-xs backdrop-blur-md transition-transform duration-200 md:hidden",
          showCompactHeader ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <button
          type="button"
          aria-label={dict.actions.back}
          onClick={() => router.back()}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Avatar shape={isEstablishment ? "establishment" : "person"} className="size-[30px] shrink-0">
          <AvatarImage className="object-cover" src={profileUser.profilePicUrl} alt={displayName} />
          <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[15px] font-semibold leading-tight">{displayName}</p>
          <p className="truncate text-2xs font-medium text-muted-foreground">
            {profileUser.userType === UserTypeGQL.INDIVIDUAL
              ? profileUser.professionalTitle || dict.profile.verifiedIndividual
              : dict.entityTypes[profileUser.entityType]}
          </p>
        </div>
        {compactPrimaryLabel && (
          <Button
            type="button"
            size="sm"
            className="h-8 max-w-[112px] shrink-0 rounded-button px-3 text-[12.5px]"
            onClick={() => void handleCompactPrimaryAction()}
          >
            <span className="min-w-0 truncate">{compactPrimaryLabel}</span>
          </Button>
        )}
      </div>

      {/* Cover — a gradient placeholder keeps the avatar's negative margin from
          sitting on nothing when the user hasn't uploaded one. */}
      <div className="relative w-full h-[150px] md:h-56">
        {profileUser.coverPicUrl ? (
          <Image
            src={profileUser.coverPicUrl}
            alt="Cover"
            fill
            className="object-cover md:rounded-t-2xl"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-200 via-muted to-secondary-200 dark:from-primary-950 dark:via-muted dark:to-secondary-950 md:rounded-t-2xl" />
        )}

        <button
          type="button"
          aria-label={dict.actions.back}
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/85 shadow-xs backdrop-blur-sm transition-colors hover:bg-card md:hidden"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwnProfile ? (
            <>
              <label htmlFor="coverPicFile">
                <div className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/85 shadow-xs backdrop-blur-sm transition-colors hover:bg-card">
                  <Camera className="h-5 w-5 text-foreground" />
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
            <ResponsiveActionMenu
              title={dict.common.actions}
              items={profileActionItems}
              trigger={
                <button
                  type="button"
                  aria-label={dict.common.actions}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/85 shadow-xs backdrop-blur-sm transition-colors hover:bg-card"
                >
                  <MoreHorizontal className="h-4 w-4 text-foreground" />
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="relative mx-0 -mt-10 bg-card px-4 pb-4 pt-0 shadow-[0_-1px_0_hsl(var(--border))] md:mx-auto md:max-w-3xl md:bg-transparent md:px-4 md:pb-0 md:shadow-none">
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

        <div className="pt-2.5 flex flex-col gap-1">
          <h1 className="font-heading text-[22px] font-semibold tracking-tight truncate">{displayName}</h1>

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

          {(isVerified || profileUser.userType === UserTypeGQL.INDIVIDUAL || isEstablishment) && (
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
              {isEstablishment && (
                <Badge variant="primary">{dict.entityTypes[profileUser.entityType]}</Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats row — a plain divided strip, not boxed tiles, matching the
            mockup. Establishments only get real, countable stats (no fake
            "practitioners" headcount — nothing in the schema tracks that). */}
        <div className="flex mt-4 border-t border-b border-border">
          {isEstablishment ? (
            <>
              <StatCell value={statsLoading ? '—' : followersCount} label={dict.profile.stats.followers} />
              <StatCell value="—" label={dict.profile.stats.practitioners} />
              <StatCell value={statsLoading ? '—' : postsCount} label={dict.profile.stats.posts} />
            </>
          ) : (
            <>
              <StatCell value={profileUser.connections.length} label={dict.common.relations} />
              <StatCell value={statsLoading ? '—' : postsCount} label={dict.profile.stats.posts} />
              <StatCell value={statsLoading ? '—' : followersCount} label={dict.profile.stats.followers} />
              <StatCell value={statsLoading ? '—' : followingCount} label={dict.profile.stats.following} />
            </>
          )}
        </div>

        <div className="flex gap-2.5 mt-3.5">
          {isOwnProfile ? (
            <>
              <UpdateProfileDialog user={profileUser}>
                <Button variant="outline" className="flex-1 h-11 min-w-0 rounded-button gap-1.5">
                  <Pencil className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{dict.button.edit}</span>
                </Button>
              </UpdateProfileDialog>
              <Button variant="outline" className="flex-1 h-11 min-w-0 rounded-button gap-1.5" onClick={() => handleShare(displayName)}>
                <Share2 className="size-4 shrink-0" />
                <span className="min-w-0 truncate">{dict.actions.share}</span>
              </Button>
            </>
          ) : isEstablishment ? (
            <>
              {isFollowing ? (
                <Button variant="outline" className="flex-1 h-11 min-w-0 rounded-button" onClick={async () => { await unfollowUser({ variables: { userId: profileUser.id } }); }}>
                  <span className="min-w-0 truncate">{dict.actions.unfollow}</span>
                </Button>
              ) : (
                <Button className="flex-1 h-11 min-w-0 rounded-button" onClick={async () => { await followUser({ variables: { userId: profileUser.id } }); }}>
                  <span className="min-w-0 truncate">{dict.actions.follow}</span>
                </Button>
              )}
              <Button variant="outline" className="flex-1 h-11 min-w-0 rounded-button" onClick={handleMessage}>
                <span className="min-w-0 truncate">{dict.actions.contact}</span>
              </Button>
            </>
          ) : (
            <>
              {renderConnectionButton()}
              <Button
                variant="outline"
                className="flex-1 h-11 min-w-0 rounded-button"
                onClick={async () => {
                  if (isFollowing) await unfollowUser({ variables: { userId: profileUser.id } });
                  else await followUser({ variables: { userId: profileUser.id } });
                }}
              >
                <span className="min-w-0 truncate">{isFollowing ? dict.actions.unfollow : dict.actions.follow}</span>
              </Button>
              <Button variant="outline" className="h-11 w-11 shrink-0 rounded-button px-0" onClick={handleMessage} aria-label={dict.actions.message}>
                <MessageCircle className="size-4" />
              </Button>
            </>
          )}
        </div>

        {isOwnProfile && (
          <ProfileCompletionCard completion={completion} dict={dict} />
        )}

        {/* Tabs — Publications first (matches the mockup's default), then
            Experience is now a real resource. "Activité" still needs a
            dedicated activity-log model before becoming a useful tab. */}
        <Tabs defaultValue="posts" className="mt-5 -mx-4 md:mx-0 md:mt-6">
          <TabsList className={cn("grid w-full bg-card px-4 md:px-0", isEstablishment ? "grid-cols-3" : "grid-cols-3")}>
            <TabsTrigger value="posts">{dict.profile.tabs.posts}</TabsTrigger>
            {isEstablishment ? (
              <>
                <TabsTrigger value="about">{dict.profile.tabs.about}</TabsTrigger>
                <TabsTrigger value="team">{dict.profile.tabs.team}</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="experience">{dict.profile.tabs.experience}</TabsTrigger>
                <TabsTrigger value="activity">{dict.profile.tabs.activity}</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-0 md:mt-6">
            <UserPostsFeed userId={profileUser.id} dict={dict} />
          </TabsContent>

          {isEstablishment ? (
            <>
              <TabsContent value="about" className="space-y-3 bg-background py-4 md:mt-6 md:py-0">
                <EntityAboutSection profileUser={profileUser} locationLabel={locationLabel} dict={dict} />
              </TabsContent>
              <TabsContent value="team" className="bg-background py-4 md:mt-6 md:py-0">
                <section className="border-y border-border bg-card p-4 md:rounded-card md:border">
                  <EmptyState
                    title={dict.profile.team.emptyTitle}
                    description={dict.profile.team.emptyDesc}
                    icon={Building2}
                  />
                </section>
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="experience" className="space-y-3 bg-background py-4 md:mt-6 md:py-0">
                <section className="border-y border-border bg-card p-4 md:rounded-card md:border">
                  <h2 className="font-heading text-[17px] font-semibold tracking-tight mb-2">{dict.profile.tabs.about}</h2>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {profileUser.bio || dict.profile.noBio}
                  </p>
                </section>

                <ProfessionalExperienceSection
                  dict={dict}
                  experiences={professionalExperiences}
                  loading={professionalExperiencesLoading}
                  isOwnProfile={isOwnProfile}
                  adding={addingProfessionalExperience}
                  updating={updatingProfessionalExperience}
                  removing={removingProfessionalExperience}
                  onAdd={async (input) => {
                    await addProfessionalExperience({ variables: { input } });
                    open("success", dict.profile.experience.createSuccessTitle, {
                      message: dict.profile.experience.createSuccessMessage,
                    });
                  }}
                  onUpdate={async (id, input) => {
                    await updateProfessionalExperience({ variables: { id, input } });
                    open("success", dict.profile.experience.updateSuccessTitle, {
                      message: dict.profile.experience.updateSuccessMessage,
                    });
                  }}
                  onRemove={async (id) => {
                    await removeProfessionalExperience({ variables: { id } });
                    open("success", dict.profile.experience.deleteSuccessTitle, {
                      message: dict.profile.experience.deleteSuccessMessage,
                    });
                  }}
                />

                {profileUser.professionalAccreditation && profileUser.professionalAccreditation.length > 0 && (
                  <section className="border-y border-border bg-card p-4 md:rounded-card md:border">
                    <h2 className="font-heading text-[17px] font-semibold tracking-tight mb-3">{dict.profile.accreditations}</h2>
                    <div className="flex flex-col gap-3">
                      {profileUser.professionalAccreditation.map((accreditation, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-field bg-secondary-100 dark:bg-secondary-950">
                            <CheckCircle2 className="size-4 text-secondary-700 dark:text-secondary-300" />
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
              <TabsContent value="activity" className="space-y-3 bg-background py-4 md:mt-6 md:py-0">
                <ProfileActivitySection displayName={displayName} dict={dict} />
              </TabsContent>
            </>
          )}
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
      <ConfirmationDialog
        open={isBlockConfirmOpen}
        onOpenChange={setIsBlockConfirmOpen}
        onConfirm={handleBlockConfirm}
        title={dict.post.blockConfirmTitle}
        message={dict.post.blockConfirmDescription}
        confirmText={dict.actions.block}
        cancelText={dict.common.cancel}
      />
    </div>
  )
}

function StatCell({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex-1 py-2.5 flex flex-col gap-0.5">
      <p className="font-heading text-[17px] font-semibold text-foreground tabular-nums">{value}</p>
      <span className="text-2xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function ProfileCompletionCard({
  completion,
  dict,
}: {
  completion: { done: number; total: number; percentage: number; tasks: string[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
}) {
  if (completion.percentage >= 100) return null;

  return (
    <section className="mt-4 rounded-[20px] border border-primary-100 bg-primary-50/80 p-4 text-primary-950 shadow-xs dark:border-primary-900 dark:bg-primary-950/45 dark:text-primary-50">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-primary-foreground">
          <ClipboardCheck className="size-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-[17px] font-semibold tracking-tight">
                {dict.profile.completion.title.replace("{percentage}", String(completion.percentage))}
              </h2>
              <p className="mt-1 text-xs leading-5 text-primary-900/75 dark:text-primary-100/75">
                {dict.profile.completion.description}
              </p>
            </div>
            <p className="shrink-0 rounded-full bg-background/85 px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
              {completion.done} / {completion.total}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/80 dark:bg-background/30">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${completion.percentage}%` }} />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {completion.tasks.map((task) => (
              <div key={task} className="flex items-center gap-2 text-[13px] font-medium text-primary-950 dark:text-primary-50">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>{task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EntityAboutSection({
  profileUser,
  locationLabel,
  dict,
}: {
  profileUser: User;
  locationLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
}) {
  const entityTypeLabel = profileUser.userType === UserTypeGQL.LEGAL_ENTITY
    ? dict.entityTypes[profileUser.entityType]
    : "";

  return (
    <section className="space-y-3 border-y border-border bg-card p-4 md:rounded-card md:border">
      <div>
        <h2 className="font-heading text-[17px] font-semibold tracking-tight">{dict.profile.tabs.about}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {profileUser.bio || dict.profile.noBio}
        </p>
      </div>
      <div className="grid gap-2">
        <EntityInfoRow icon={Building2} label={dict.register.entityStructureTypeLabel} value={entityTypeLabel} />
        {locationLabel && <EntityInfoRow icon={MapPin} label={dict.register.entityAddressLabel} value={locationLabel} />}
        {profileUser.websiteUrl && (
          <EntityInfoRow
            icon={Share2}
            label={dict.register.websiteUrlLabel}
            value={profileUser.websiteUrl}
          />
        )}
      </div>
    </section>
  );
}

function ProfileActivitySection({
  displayName,
  dict,
}: {
  displayName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
}) {
  const filters = [
    dict.profile.activity.filters.all,
    dict.profile.activity.filters.comments,
    dict.profile.activity.filters.reactions,
  ];

  return (
    <>
      <section className="border-y border-border bg-card px-4 pb-3 pt-3 md:rounded-card md:border">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold",
                index === 0
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-muted-foreground"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        <p className="pt-2 text-[12.5px] leading-relaxed text-muted-foreground">
          {dict.profile.activity.privacyNote}
        </p>
      </section>
      <section className="border-y border-border bg-card md:rounded-card md:border">
        <ActivityPlaceholder
          icon={MessageSquareText}
          title={dict.profile.activity.commentTitle.replace("{name}", displayName)}
          description={dict.profile.activity.apiPendingDescription}
        />
        <ActivityPlaceholder
          icon={ThumbsUp}
          title={dict.profile.activity.reactionTitle.replace("{name}", displayName)}
          description={dict.profile.activity.apiPendingDescription}
        />
        <ActivityPlaceholder
          icon={Users}
          title={dict.profile.activity.groupTitle.replace("{name}", displayName)}
          description={dict.profile.activity.apiPendingDescription}
          last
        />
      </section>
    </>
  );
}

function ActivityPlaceholder({
  icon: Icon,
  title,
  description,
  last,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <article className={cn("px-4 py-3", !last && "border-b border-border/70")}>
      <div className="mb-2 flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Icon className="size-4 shrink-0" strokeWidth={1.9} />
        <span className="font-medium text-foreground">{title}</span>
        <span className="ml-auto font-mono text-[11px]">{`--`}</span>
      </div>
      <div className="rounded-[12px] border border-dashed border-border bg-muted/35 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground dark:bg-muted/15">
        {description}
      </div>
    </article>
  );
}

function EntityInfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-muted/35 px-3 py-2.5 dark:bg-muted/15">
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-[13px] font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function getProfileCompletion(
  user: User,
  experiences: ProfessionalExperience[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any,
) {
  const hasLocation = Boolean(user.location?.city || user.location?.country);
  const baseItems = [
    { done: Boolean(user.profilePicUrl), task: dict.profile.completion.tasks.profilePhoto },
    { done: Boolean(user.coverPicUrl), task: dict.profile.completion.tasks.cover },
    { done: Boolean(user.bio), task: dict.profile.completion.tasks.bio },
    { done: hasLocation, task: dict.profile.completion.tasks.location },
    { done: Boolean(user.websiteUrl), task: dict.profile.completion.tasks.website },
  ];
  const typedItems = user.userType === UserTypeGQL.INDIVIDUAL
    ? [
      { done: Boolean(user.professionalTitle), task: dict.profile.completion.tasks.title },
      { done: Boolean(user.speciality), task: dict.profile.completion.tasks.speciality },
      { done: experiences.length > 0, task: dict.profile.completion.tasks.experience },
      { done: Boolean(user.professionalAccreditation?.length), task: dict.profile.completion.tasks.accreditation },
      { done: Boolean(user.phoneNumber), task: dict.profile.completion.tasks.phone },
    ]
    : [
      { done: Boolean(user.entityName), task: dict.profile.completion.tasks.entityName },
      { done: Boolean(user.entityType), task: dict.profile.completion.tasks.entityType },
      { done: Boolean(user.phoneNumber), task: dict.profile.completion.tasks.phone },
      { done: Boolean(user.email), task: dict.profile.completion.tasks.email },
      { done: Boolean(user.professionalAccreditation?.length), task: dict.profile.completion.tasks.accreditation },
    ];

  const items = [...baseItems, ...typedItems];
  const done = items.filter((item) => item.done).length;
  const tasks = items.filter((item) => !item.done).slice(0, 2).map((item) => item.task);

  return {
    done,
    total: items.length,
    percentage: Math.round((done / items.length) * 100),
    tasks,
  };
}

function ProfessionalExperienceSection({
  dict,
  experiences,
  loading,
  isOwnProfile,
  adding,
  updating,
  removing,
  onAdd,
  onUpdate,
  onRemove,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
  experiences: ProfessionalExperience[];
  loading: boolean;
  isOwnProfile: boolean;
  adding: boolean;
  updating: boolean;
  removing: boolean;
  onAdd: (input: Parameters<React.ComponentProps<typeof ProfessionalExperienceDialog>["onSubmit"]>[0]) => Promise<void>;
  onUpdate: (id: string, input: Parameters<React.ComponentProps<typeof ProfessionalExperienceDialog>["onSubmit"]>[0]) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [experienceToDelete, setExperienceToDelete] = useState<ProfessionalExperience | null>(null);

  return (
    <section className="border-y border-border bg-card p-4 md:rounded-card md:border">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-[17px] font-semibold tracking-tight">
          {dict.profile.tabs.experience}
        </h2>
        {isOwnProfile && (
          <ProfessionalExperienceDialog loading={adding} onSubmit={onAdd}>
            <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 rounded-full px-3 text-xs">
              <Plus className="size-3.5" />
              {dict.profile.experience.addButton}
            </Button>
          </ProfessionalExperienceDialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-[42px] shrink-0 rounded-field" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5 rounded-full" />
                <Skeleton className="h-3 w-2/3 rounded-full" />
                <Skeleton className="h-3 w-1/2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : experiences.length > 0 ? (
        <div className="flex flex-col gap-4">
          {experiences.map((experience) => (
            <ProfessionalExperienceRow
              key={experience.id}
              experience={experience}
              currentLabel={dict.profile.experience.current}
              isOwnProfile={isOwnProfile}
              updating={updating}
              removing={removing}
              onUpdate={(input) => onUpdate(experience.id, input)}
              onRemove={() => setExperienceToDelete(experience)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={dict.profile.experience.emptyTitle}
          description={dict.profile.experience.emptyDesc}
          icon={BriefcaseBusiness}
        />
      )}
      <ConfirmationDialog
        open={Boolean(experienceToDelete)}
        onOpenChange={(open) => {
          if (!open) setExperienceToDelete(null);
        }}
        onConfirm={async () => {
          if (!experienceToDelete) return;
          await onRemove(experienceToDelete.id);
          setExperienceToDelete(null);
        }}
        title={dict.profile.experience.deleteConfirmTitle}
        message={dict.profile.experience.deleteConfirmMessage}
        confirmText={dict.actions.delete}
      />
    </section>
  );
}

function ProfessionalExperienceRow({
  experience,
  currentLabel,
  isOwnProfile,
  updating,
  removing,
  onUpdate,
  onRemove,
}: {
  experience: ProfessionalExperience;
  currentLabel: string;
  isOwnProfile: boolean;
  updating: boolean;
  removing: boolean;
  onUpdate: React.ComponentProps<typeof ProfessionalExperienceDialog>["onSubmit"];
  onRemove: () => void;
}) {
  const initials = getOrganizationInitials(experience.organizationName);
  const range = formatExperienceDateRange(
    experience.startDate,
    experience.endDate,
    experience.isCurrent,
    currentLabel,
  );

  return (
    <article className="flex gap-3">
      <div className="flex size-[42px] shrink-0 items-center justify-center rounded-field bg-gradient-to-br from-secondary-100 to-secondary-50 font-mono text-[13px] font-bold text-secondary-700 dark:from-secondary-950 dark:to-muted dark:text-secondary-300">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-foreground">
            {experience.title}
          </h3>
          {isOwnProfile && (
            <div className="flex shrink-0 items-center gap-1">
              <ProfessionalExperienceDialog experience={experience} loading={updating} onSubmit={onUpdate}>
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Modifier l'expérience"
                >
                  <Pencil className="size-3.5" />
                </button>
              </ProfessionalExperienceDialog>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer l'expérience"
                disabled={removing}
                onClick={onRemove}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>
        <p className="mt-1 truncate text-[13.5px] text-muted-foreground">
          {[experience.organizationName, experience.employmentType].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[range, experience.location].filter(Boolean).join(" · ")}
        </p>
        {experience.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground">
            {experience.description}
          </p>
        )}
      </div>
    </article>
  );
}

function getOrganizationInitials(organizationName: string) {
  return organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function formatExperienceDateRange(
  startDate: string,
  endDate: string | undefined,
  isCurrent: boolean,
  currentLabel: string,
) {
  const start = formatMonthYear(startDate);
  const end = isCurrent ? currentLabel : endDate ? formatMonthYear(endDate) : "";
  return [start, end].filter(Boolean).join(" - ");
}

function formatMonthYear(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${month}/${date.getUTCFullYear()}`;
}

function UserPostsFeed({ userId, dict }: { userId: string, dict: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { posts, loading, loadMore } = useUserPosts(userId);

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-card" />
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
    <div className="md:overflow-hidden md:rounded-card">
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

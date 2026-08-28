"use client";

import React from "react";
import {
  Ban,
  Bookmark,
  Flag,
  Heart,
  MessageCircle,
  MoreVertical,
  Pencil,
  Share2,
  ShieldOff,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ResponsiveActionMenu, ResponsiveActionMenuItem } from "@/components/ui/responsive-action-menu"
import { useBookmarkActions, useFollowActions, useBlockActions, useMe, useLikePostActions, useLikesSubscription } from "@/hooks/useData/index"
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { muteAuthor } from "@/lib/muted-authors";
import { cn } from "@/lib/utils";
import { Post } from "@/types/Post";
import { IndividualUser, LegalEntityUser, UserTypeGQL } from "@/types/User";
import { useRouter } from "next/navigation";
import { PostMedia } from "./PostMedia";
import { usePostMutations } from "@/hooks/useData/usePostData";
import EditPostDialog from "./EditPostDialog";
import ConfirmationDialog from "./ConfirmationDialog";
import ReportDialog from "./ReportDialog";

const formatTimeAgo = (isoDate: string, dict: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const date = new Date(isoDate);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return dict.timeAgo.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${dict.timeAgo.m}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${dict.timeAgo.h}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}${dict.timeAgo.d}`;
  return date.toLocaleDateString();
};

interface FeedItemCardProps {
  item: Post;
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const dict = useDictionary();
  const router = useRouter();
  const { open } = useNotification();
  const { me } = useMe();
  const { removePost, removing } = usePostMutations();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = React.useState(false);

  const authorId = item.author?.id;
  const { likePost, unlikePost, liking, unliking } = useLikePostActions(item.id);
  useLikesSubscription(item.id, 'Post');
  const { followUser, unfollowUser, following: followingReq, unfollowing } = useFollowActions();
  const { blockUser, unblockUser, blocking, unblocking } = useBlockActions();
  const { addBookmark, removeBookmark, adding: addingBookmark, removing: removingBookmark } = useBookmarkActions(item.id, 'Post');
  const postItem = item;
  const isOwnItem = authorId === me?.id;

  const isLiked = item.isLiked ?? false;
  const isFollowing = !!(authorId && me?.following?.includes(authorId));
  const isBlocked = !!(authorId && me?.blockedUsers?.includes(authorId));

  const handleLikeToggle = () => {
    if (isLiked) unlikePost();
    else likePost();
  };

  const handleFollowToggle = async () => {
    if (!authorId) return;
    try {
      if (isFollowing) await unfollowUser({
        variables: {
          userId: authorId,
        }
      });
      else await followUser({
        variables: {
          userId: authorId,
        }
      });
    } catch (e) {
      console.error("Follow/unfollow failed", e);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!me) return;
    try {
      if (item.isBookmarked) {
        await removeBookmark();
      } else {
        await addBookmark();
      }
    } catch (e) {
      console.error("Bookmark toggle failed", e);
    }
  };
  const goToDetail = () => {
    router.push(`/post/${item.id}`);
  };

  const handleMute = () => {
    muteAuthor(item.author.id);
    open("success", dict.post.mutedTitle, { message: dict.post.mutedMessage });
  };

  const handleBlockConfirm = async () => {
    if (!authorId) return;
    try {
      await blockUser({ variables: { userId: authorId } });
      setIsBlockConfirmOpen(false);
      open("success", dict.post.blockedTitle, { message: dict.post.blockedMessage });
    } catch (e) {
      console.error("Block failed", e);
    }
  };

  const handleUnblock = async () => {
    if (!authorId) return;
    try {
      await unblockUser({ variables: { userId: authorId } });
    } catch (e) {
      console.error("Unblock failed", e);
    }
  };

  const handleDelete = async () => {
    try {
      await removePost({ variables: { id: postItem.id } });
      open("success", dict.post.deleteTitle, {
        message: dict.post.deleteSuccess,
      });
      setIsDeleteOpen(false);
    } catch (error) {
      open("error", dict.notifications.updateFailed.title, {
        message:
          error instanceof Error
            ? error.message
            : dict.notifications.updateFailed.defaultMessage,
      });
    }
  };

  const actionItems: ResponsiveActionMenuItem[] = [
    ...(isOwnItem
      ? [
        {
          key: "edit",
          label: dict.actions.edit,
          icon: Pencil,
          onSelect: () => setIsEditOpen(true),
        },
        {
          key: "delete",
          label: dict.actions.delete,
          icon: Trash2,
          destructive: true,
          disabled: removing,
          onSelect: () => setIsDeleteOpen(true),
        },
      ]
      : []),
    {
      key: "bookmark",
      label: item.isBookmarked ? dict.actions.removeBookmark : dict.actions.bookmark,
      icon: Bookmark,
      disabled: addingBookmark || removingBookmark,
      separatorBefore: isOwnItem,
      onSelect: handleBookmarkToggle,
    },
    {
      key: "mute",
      label: dict.actions.mute,
      icon: Ban,
      onSelect: handleMute,
    },
    {
      key: "report",
      label: dict.actions.report,
      icon: Flag,
      onSelect: () => setIsReportOpen(true),
    },
    ...(authorId && authorId !== me?.id
      ? [
        {
          key: "follow",
          label: isFollowing ? dict.actions.unfollow : dict.actions.follow,
          icon: isFollowing ? UserMinus : UserPlus,
          disabled: followingReq || unfollowing,
          onSelect: handleFollowToggle,
        },
        {
          key: "block",
          label: isBlocked ? dict.actions.unblock : dict.actions.block,
          icon: ShieldOff,
          destructive: true,
          disabled: blocking || unblocking,
          onSelect: isBlocked ? handleUnblock : () => setIsBlockConfirmOpen(true),
        },
      ]
      : []),
  ];

  return (
    <>
      {postItem && (
        <EditPostDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          post={postItem}
        />
      )}
      <ReportDialog open={isReportOpen} onOpenChange={setIsReportOpen} postId={item.id} />
      <ConfirmationDialog
        open={isBlockConfirmOpen}
        onOpenChange={setIsBlockConfirmOpen}
        onConfirm={handleBlockConfirm}
        title={dict.post.blockConfirmTitle}
        message={dict.post.blockConfirmDescription}
        confirmText={dict.actions.block}
        cancelText={dict.common.cancel}
      />
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title={dict.post.deleteTitle}
        message={dict.post.deleteDescription}
        confirmText={dict.actions.delete}
        cancelText={dict.common.cancel}
      />
      <div className="mb-2 border-y border-border bg-card px-4 py-3 text-card-foreground shadow-none md:mb-3 md:rounded-card md:border md:py-4 md:shadow-xs">
        <div className="flex items-start justify-between">
          <div onClick={() => router.push(`/profile/${item.author.slug}`)} className="flex items-start gap-2.5 cursor-pointer min-w-0">
            <Avatar
              shape={item.author.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"}
              className="h-10 w-10 shrink-0"
            >
              <AvatarImage className="object-cover" src={item.author.profilePicUrl} />
              <AvatarFallback>{getUserInitials(item.author)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-[15px] leading-tight truncate">{getUserDisplayName(item.author)}</span>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.author.userType === UserTypeGQL.INDIVIDUAL ? (item.author as IndividualUser).professionalTitle : dict.entityTypes[(item.author as LegalEntityUser).entityType]}
              </p>
              <span className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(item.createdAt, dict)}</span>
            </div>
          </div>
          <ResponsiveActionMenu
            title={dict.common.actions}
            items={actionItems}
            trigger={
              <button type="button" aria-label={dict.common.actions} className="p-1.5 rounded-full hover:bg-muted">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            }
          />
        </div>

        <div className="pt-2">
          <p className="text-[15px] leading-[1.55] whitespace-pre-wrap">{item.content}</p>
          {item.media && <PostMedia media={item.media} />}
        </div>

        <div className="flex items-center gap-1.5 border-b border-border pt-3 pb-2 text-muted-foreground">
          {item.likesCount > 0 && (
            <span className="flex items-center">
              <span className="flex size-[19px] items-center justify-center rounded-full border border-card bg-primary text-primary-foreground">
                <Heart className="size-2.5 fill-current" />
              </span>
              <span className="-ml-1.5 flex size-[19px] items-center justify-center rounded-full border border-card bg-secondary-500 text-white">
                <MessageCircle className="size-2.5" strokeWidth={2.4} />
              </span>
            </span>
          )}
          <span className="text-xs">{item.likesCount} {dict.post.reactions}</span>
          <span className="ml-auto text-xs">{item.commentsCount} {dict.post.comments}</span>
        </div>
        <div className="-mx-2 mt-1 flex min-w-0 pt-0.5">
          <Button variant="ghost" onClick={handleLikeToggle} disabled={liking || unliking} className="min-w-0 h-11 flex-1 rounded-button gap-1 px-1.5 py-0 text-[13px] font-semibold hover:bg-muted/80" aria-pressed={isLiked}>
            <Heart className={cn("size-4 shrink-0", isLiked && "fill-error text-error")} />
            <span className="min-w-0 truncate">{isLiked ? dict.actions.unlike : dict.actions.like}</span>
          </Button>
          <Button variant="ghost" onClick={goToDetail} className="min-w-0 h-11 flex-1 rounded-button gap-1 px-1.5 py-0 text-[13px] font-semibold hover:bg-muted/80">
            <MessageCircle className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{dict.actions.comment}</span>
          </Button>
          <Button variant="ghost" className="min-w-0 h-11 flex-1 rounded-button gap-1 px-1.5 py-0 text-[13px] font-semibold hover:bg-muted/80" aria-label={dict.actions.share}>
            <Share2 className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{dict.actions.share}</span>
          </Button>
        </div>
      </div>
    </>
  );
}

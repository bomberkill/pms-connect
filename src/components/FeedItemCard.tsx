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
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBookmarkActions, useFollowActions, useMe, useLikePostActions, useLikesSubscription } from "@/hooks/useData/index"
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
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

  const authorId = item.author?.id;
  const { likePost, unlikePost, liking, unliking } = useLikePostActions(item.id);
  useLikesSubscription(item.id, 'Post');
  const { followUser, unfollowUser, following: followingReq, unfollowing } = useFollowActions();
  const { addBookmark, removeBookmark, adding: addingBookmark, removing: removingBookmark } = useBookmarkActions(item.id, 'Post');
  const postItem = item;
  const isOwnItem = authorId === me?.id;

  const isLiked = item.isLiked ?? false;
  const isFollowing = !!(authorId && me?.following?.includes(authorId));

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
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title={dict.post.deleteTitle}
        message={dict.post.deleteDescription}
        confirmText={dict.actions.delete}
        cancelText={dict.common.cancel}
      />
      <div className="text-card-foreground rounded-card border border-border bg-card px-4 py-4 shadow-xs mb-3">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="More options" className="p-1.5 rounded-full hover:bg-muted">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{dict.common.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isOwnItem && (
                <>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> {dict.actions.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => setIsDeleteOpen(true)} disabled={removing}>
                    <Trash2 className="mr-2 h-4 w-4" /> {dict.actions.delete}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="cursor-pointer" onClick={handleBookmarkToggle} disabled={addingBookmark || removingBookmark}>
                <Bookmark className={cn("mr-2 h-4 w-4", item.isBookmarked && "fill-primary text-primary")} />
                {item.isBookmarked ? dict.actions.removeBookmark : dict.actions.bookmark}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer"><Ban className="mr-2 h-4 w-4" /> {dict.actions.mute}</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setIsReportOpen(true)}><Flag className="mr-2 h-4 w-4" /> {dict.actions.report}</DropdownMenuItem>
              {authorId && authorId !== me?.id && (
                <DropdownMenuItem className="cursor-pointer" onClick={handleFollowToggle} disabled={followingReq || unfollowing}>{isFollowing ? <><UserMinus className="mr-2 h-4 w-4" /> {dict.actions.unfollow}</> : <><UserPlus className="mr-2 h-4 w-4" /> {dict.actions.follow}</>}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="pt-2">
          <p className="text-base leading-relaxed whitespace-pre-wrap">{item.content}</p>
          {item.media && <PostMedia media={item.media} />}
        </div>

        <div className="flex items-center gap-1.5 pt-3 text-muted-foreground">
          <Heart className="size-3.5" />
          <span className="text-xs">{item.likesCount} {dict.post.reactions}</span>
          <span className="ml-auto text-xs">{item.commentsCount} {dict.post.comments}</span>
        </div>
        <div className="-mx-1 mt-1 flex border-t border-border pt-1">
          <Button variant="ghost" onClick={handleLikeToggle} disabled={liking || unliking} className="h-auto flex-1 rounded-lg gap-1.5 py-2.5 text-[13.5px] font-semibold hover:bg-muted/80" aria-pressed={isLiked}>
            <Heart className={cn("size-4", isLiked && "fill-error text-error")} />
            {isLiked ? dict.actions.unlike : dict.actions.like}
          </Button>
          <Button variant="ghost" onClick={goToDetail} className="h-auto flex-1 rounded-lg gap-1.5 py-2.5 text-[13.5px] font-semibold hover:bg-muted/80">
            <MessageCircle className="size-4" />
            {dict.actions.comment}
          </Button>
          <Button variant="ghost" className="h-auto flex-1 rounded-lg gap-1.5 py-2.5 text-[13.5px] font-semibold hover:bg-muted/80" aria-label={dict.actions.share}>
            <Share2 className="size-4" />
            {dict.actions.share}
          </Button>
        </div>
      </div>
    </>
  );
}

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
import { useBookmarkActions, useFollowActions, useMe, useLikeCommentActions, useLikePostActions, useLikesSubscription, useCommentActions } from "@/hooks/useData/index"
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import { Comment } from "@/types/Comment";
import { Post } from "@/types/Post";
import { IndividualUser, LegalEntityUser, UserTypeGQL } from "@/types/User";
import { useRouter } from "next/navigation";
import { PostMedia } from "./PostMedia";
import { usePostMutations } from "@/hooks/useData/usePostData";
import EditPostDialog from "./EditPostDialog";
import ConfirmationDialog from "./ConfirmationDialog";

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
  item: Post | Comment;
  isComment?: boolean;
}

export default function FeedItemCard({ item, isComment = false }: FeedItemCardProps) {
  const dict = useDictionary();
  const router = useRouter();
  const { open } = useNotification();
  const { me } = useMe();
  const { removePost, removing } = usePostMutations();
  const { removeComment, removing: removingComment } = useCommentActions();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const authorId = item.author?.id;
  const { likePost, unlikePost, liking, unliking } = useLikePostActions(item.id);
  const { likeComment, unlikeComment } = useLikeCommentActions(item.id);
  useLikesSubscription(item.id, isComment ? 'Comment' : 'Post');
  const { followUser, unfollowUser, following: followingReq, unfollowing } = useFollowActions();
  const { addBookmark, removeBookmark, adding: addingBookmark, removing: removingBookmark } = useBookmarkActions(item.id, isComment ? 'Comment' : 'Post');
  const postItem = !isComment ? item as Post : null;
  const isOwnItem = authorId === me?.id;

  const isLiked = 'isLiked' in item ? item.isLiked : false;
  const isFollowing = !!(authorId && me?.following?.includes(authorId));

  const handleLikeToggle = () => {
    if (isComment) {
      if (isLiked) unlikeComment();
      else likeComment();
    } else {
      if (isLiked) unlikePost();
      else likePost();
    }
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
    const postPath = isComment ? `/post/${item.id}?isComment=true` : `/post/${item.id}`;
    router.push(postPath);
  };

  const handleDelete = async () => {
    try {
      if (isComment) {
        await removeComment({ variables: { commentId: item.id } });
      } else if (postItem) {
        await removePost({ variables: { id: postItem.id } });
      }
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
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title={dict.post.deleteTitle}
        message={dict.post.deleteDescription}
        confirmText={dict.actions.delete}
        cancelText={dict.common.cancel}
      />
      <div className={cn(
        "text-card-foreground",
        isComment
          ? "bg-muted/40 rounded-2xl border-l-2 border-l-primary/25 px-3 py-3 mb-2"
          : "rounded-card border border-border bg-card px-4 py-4 shadow-xs mb-3"
      )}>
        <div className="flex items-center justify-between">
          <div onClick={() => router.push(`/profile/${item.author.slug}`)} className="flex items-center gap-2.5 cursor-pointer">
            <Avatar className={isComment ? "h-7 w-7" : "h-9 w-9"}>
              <AvatarImage className="object-cover" src={item.author.profilePicUrl} />
              <AvatarFallback>{getUserInitials(item.author)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm leading-tight">{getUserDisplayName(item.author)}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(item.createdAt, dict)}</span>
              </div>
              {!isComment && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.author.userType === UserTypeGQL.INDIVIDUAL ? (item.author as IndividualUser).professionalTitle : dict.entityTypes[(item.author as LegalEntityUser).entityType]}
                </p>
              )}
            </div>
          </div>
          {isComment ? (
            isOwnItem && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                aria-label={dict.actions.delete}
                disabled={removingComment}
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="More options" className="p-1.5 rounded-full hover:bg-muted">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{dict.common.actions}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isOwnItem && postItem && (
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
                <DropdownMenuItem className="cursor-pointer"><Ban className="mr-2 h-4 w-4" /> {dict.actions.mute}</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer"><Flag className="mr-2 h-4 w-4" /> {dict.actions.report}</DropdownMenuItem>
                {authorId && authorId !== me?.id && (
                  <DropdownMenuItem className="cursor-pointer" onClick={handleFollowToggle} disabled={followingReq || unfollowing}>{isFollowing ? <><UserMinus className="mr-2 h-4 w-4" /> {dict.actions.unfollow}</> : <><UserPlus className="mr-2 h-4 w-4" /> {dict.actions.follow}</>}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className={cn(isComment ? "pl-9 pt-1" : "pt-2")}>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{item.content}</p>
          {'media' in item && <PostMedia media={item.media} />}
        </div>

        <div className={cn("flex items-center justify-between text-muted-foreground", isComment ? "pl-9 pt-1" : "pt-2 -ml-3")}>
          <div className="flex items-center justify-start gap-1">
            <Button variant="ghost" onClick={handleLikeToggle} disabled={liking || unliking} className="h-auto rounded-full gap-2 px-3 py-2 hover:bg-muted/80" aria-label={isLiked ? dict.actions.unlike : dict.actions.like} aria-pressed={!!isLiked}>
              <Heart className={cn("size-4.5", isLiked && "fill-error text-error")} />
              <span className="text-sm font-medium tabular-nums">{'likesCount' in item ? item.likesCount : 0}</span>
            </Button>
            <Button variant="ghost" onClick={goToDetail} className="h-auto rounded-full gap-2 px-3 py-2 hover:bg-muted/80" aria-label={dict.actions.comment}>
              <MessageCircle className="size-4.5" />
              <span className="text-sm font-medium tabular-nums">{'commentsCount' in item ? item.commentsCount : 0}</span>
            </Button>
            {!isComment && (
              <Button variant="ghost" className="h-auto rounded-full gap-2 px-3 py-2 hover:bg-muted/80" aria-label={dict.actions.share}>
                <Share2 className="size-4.5" />
              </Button>
            )}
          </div>
          {!isComment && (
            <Button
              variant="ghost"
              onClick={handleBookmarkToggle}
              disabled={addingBookmark || removingBookmark}
              className="h-auto rounded-full gap-2 px-3 py-2 hover:bg-muted/80"
              aria-label={item.isBookmarked ? dict.actions.removeBookmark : dict.actions.bookmark}
            >
              <Bookmark className={cn("size-4.5", item.isBookmarked && "fill-primary text-primary")} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

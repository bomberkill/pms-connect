"use client";

import React from "react";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLikeCommentActions, useLikesSubscription, useCommentActions, useMe } from "@/hooks/useData/index";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import { Comment, CommentStatus } from "@/types/Comment";
import { PostMedia } from "./PostMedia";
import ConfirmationDialog from "./ConfirmationDialog";
import { useRouter } from "next/navigation";

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

interface CommentItemProps {
  comment: Comment;
  depth: 1 | 2;
  repliesExpanded?: boolean;
  onToggleReplies?: () => void;
  onReply: (target: { parentId: string; label: string }) => void;
  highlighted?: boolean;
}

const CommentItem = React.forwardRef<HTMLDivElement, CommentItemProps>(function CommentItem(
  { comment, depth, repliesExpanded, onToggleReplies, onReply, highlighted },
  ref
) {
  const dict = useDictionary();
  const router = useRouter();
  const { open } = useNotification();
  const { me } = useMe();
  const { removeComment, removing: removingComment } = useCommentActions();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const authorId = comment.author?.id;
  const { likeComment, unlikeComment } = useLikeCommentActions(comment.id);
  useLikesSubscription(comment.id, 'Comment');

  const isOwnItem = authorId === me?.id;
  const isDeletedComment = comment.status === CommentStatus.DELETED;
  const isPostAuthorComment = comment.post?.author?.id === comment.author?.id;
  const isEditedComment = comment.updatedAt !== comment.createdAt;
  const isLiked = !!comment.isLiked;

  const handleLikeToggle = () => {
    if (isLiked) unlikeComment();
    else likeComment();
  };

  const handleDelete = async () => {
    try {
      await removeComment({ variables: { commentId: comment.id } });
      open("success", dict.post.deleteTitle, { message: dict.post.deleteSuccess });
      setIsDeleteOpen(false);
    } catch (error) {
      open("error", dict.notifications.updateFailed.title, {
        message: error instanceof Error ? error.message : dict.notifications.updateFailed.defaultMessage,
      });
    }
  };

  const replyTargetParentId = depth === 1 ? comment.id : (comment.parent?.id || comment.id);

  return (
    <div ref={ref} className={cn(depth === 2 && "ml-8")}>
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title={dict.post.deleteTitle}
        message={dict.post.deleteDescription}
        confirmText={dict.actions.delete}
        cancelText={dict.common.cancel}
      />
      <div
        className={cn(
          "bg-muted/40 rounded-2xl border-l-2 border-l-primary/25 px-3 py-3 mb-2 transition-colors",
          highlighted && "ring-2 ring-primary bg-primary-50"
        )}
      >
        <div className="flex items-start justify-between">
          <div onClick={() => router.push(`/profile/${comment.author.slug}`)} className="flex items-start gap-2.5 cursor-pointer min-w-0">
            <Avatar shape="person" className="h-7 w-7 shrink-0">
              <AvatarImage className="object-cover" src={comment.author.profilePicUrl} />
              <AvatarFallback>{getUserInitials(comment.author)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm leading-tight">{getUserDisplayName(comment.author)}</span>
              {isPostAuthorComment && (
                <span className="text-2xs font-semibold text-primary-800 bg-primary-100 rounded-full px-1.5 py-0.5">
                  {dict.post.authorBadge}
                </span>
              )}
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt, dict)}</span>
              {isEditedComment && !isDeletedComment && (
                <span className="text-2xs text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
                  {dict.post.edited}
                </span>
              )}
            </div>
          </div>
          {isOwnItem && !isDeletedComment && (
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
          )}
        </div>

        <div className="pl-9 pt-1">
          {isDeletedComment ? (
            <p className="text-sm italic text-muted-foreground">{dict.post.commentDeleted}</p>
          ) : (
            <>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              {comment.media && comment.media.length > 0 && <PostMedia media={comment.media} />}
            </>
          )}
        </div>

        {!isDeletedComment && (
          <div className="flex items-center justify-start gap-1 pl-9 pt-1 text-muted-foreground">
            <Button variant="ghost" onClick={handleLikeToggle} className="h-auto rounded-full gap-2 px-3 py-2 hover:bg-muted/80" aria-label={isLiked ? dict.actions.unlike : dict.actions.like} aria-pressed={isLiked}>
              <Heart className={cn("size-4.5", isLiked && "fill-error text-error")} />
              <span className="text-sm font-medium tabular-nums">{comment.likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => onReply({ parentId: replyTargetParentId, label: `@${getUserDisplayName(comment.author)}` })}
              className="h-auto rounded-full gap-2 px-3 py-2 hover:bg-muted/80"
            >
              {dict.post.reply}
            </Button>
            {depth === 1 && comment.commentsCount > 0 && (
              <Button variant="ghost" onClick={onToggleReplies} className="h-auto rounded-full gap-2 px-3 py-2 hover:bg-muted/80">
                <MessageCircle className="size-4.5" />
                <span className="text-sm font-medium tabular-nums">
                  {repliesExpanded ? dict.post.hideReplies : dict.post.viewReplies.replace("{count}", String(comment.commentsCount))}
                </span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default CommentItem;

"use client";

import React from "react";
import { Flag, Heart, MessageCircle, MoreHorizontal, Trash2 } from "lucide-react";
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
import ReportDialog from "./ReportDialog";
import { useRouter } from "next/navigation";
import { ResponsiveActionMenu, ResponsiveActionMenuItem } from "@/components/ui/responsive-action-menu";

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
  const [isReportOpen, setIsReportOpen] = React.useState(false);

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
  const actionItems: ResponsiveActionMenuItem[] = isOwnItem
    ? [
      {
        key: "delete",
        label: dict.actions.delete,
        icon: Trash2,
        destructive: true,
        disabled: removingComment,
        onSelect: () => setIsDeleteOpen(true),
      },
    ]
    : [
      {
        key: "report",
        label: dict.actions.report,
        icon: Flag,
        onSelect: () => setIsReportOpen(true),
      },
    ];

  return (
    <div ref={ref} className={cn(depth === 2 && "ml-[13px] border-l-2 border-border pl-[13px]")}>
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title={dict.post.deleteTitle}
        message={dict.post.deleteDescription}
        confirmText={dict.actions.delete}
        cancelText={dict.common.cancel}
      />
      <ReportDialog open={isReportOpen} onOpenChange={setIsReportOpen} commentId={comment.id} />

      <article
        className={cn(
          "mb-1.5 rounded-field py-2 transition-colors",
          highlighted && "bg-primary-50 px-2 ring-2 ring-primary dark:bg-primary-950"
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar shape="person" className={cn("shrink-0", depth === 1 ? "size-9" : "size-[30px]")}>
            <AvatarImage className="object-cover" src={comment.author.profilePicUrl} />
            <AvatarFallback>{getUserInitials(comment.author)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div onClick={() => router.push(`/profile/${comment.author.slug}`)} className="min-w-0 cursor-pointer">
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="truncate text-sm font-semibold leading-tight">{getUserDisplayName(comment.author)}</span>
                  {isPostAuthorComment && (
                    <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-2xs font-semibold text-primary-800 dark:bg-primary-950 dark:text-primary-200">
                      {dict.post.authorBadge}
                    </span>
                  )}
                  {isEditedComment && !isDeletedComment && (
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-2xs text-muted-foreground">
                      {dict.post.edited}
                    </span>
                  )}
                </div>
                {"professionalTitle" in comment.author && comment.author.professionalTitle && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{comment.author.professionalTitle}</p>
                )}
              </div>

              {!isDeletedComment && (
                <ResponsiveActionMenu
                  title={dict.common.actions}
                  items={actionItems}
                  trigger={
                    <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 rounded-full text-muted-foreground">
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  }
                />
              )}
            </div>

            <div className="pt-1">
              {isDeletedComment ? (
                <p className="text-sm italic text-muted-foreground">{dict.post.commentDeleted}</p>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{comment.content}</p>
                  {comment.media && comment.media.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-field border border-border">
                      <PostMedia media={comment.media} />
                    </div>
                  )}
                </>
              )}
            </div>

            {!isDeletedComment && (
              <div className="mt-1 flex min-w-0 flex-wrap items-center justify-start gap-1 text-muted-foreground">
                <Button variant="ghost" onClick={handleLikeToggle} className="h-8 min-w-0 rounded-full gap-1 px-2 hover:bg-muted/80" aria-label={isLiked ? dict.actions.unlike : dict.actions.like} aria-pressed={isLiked}>
                  <Heart className={cn("size-3.5 shrink-0", isLiked && "fill-error text-error")} />
                  <span className="text-xs font-semibold">{dict.actions.like}</span>
                  {comment.likesCount > 0 && <span className="text-xs font-semibold tabular-nums">{comment.likesCount}</span>}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onReply({ parentId: replyTargetParentId, label: `@${getUserDisplayName(comment.author)}` })}
                  className="h-8 min-w-0 rounded-full px-2 text-xs font-semibold hover:bg-muted/80"
                >
                  <span className="truncate">{dict.post.reply}</span>
                </Button>
                <span className="px-1 text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt, dict)}</span>
                {depth === 1 && comment.commentsCount > 0 && (
                  <Button variant="ghost" onClick={onToggleReplies} className="h-8 min-w-0 rounded-full gap-1 px-2 hover:bg-muted/80">
                    <MessageCircle className="size-3.5 shrink-0" />
                    <span className="truncate text-xs font-semibold tabular-nums">
                      {repliesExpanded ? dict.post.hideReplies : dict.post.viewReplies.replace("{count}", String(comment.commentsCount))}
                    </span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
});

export default CommentItem;

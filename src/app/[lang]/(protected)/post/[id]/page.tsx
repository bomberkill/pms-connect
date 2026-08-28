"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePost, useMe, useBookmarkActions, useLikePostActions } from "@/hooks/useData/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Bookmark, MoreHorizontal, Pencil, Trash2, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import CommentThread from "@/components/CommentThread";
import { IndividualUser, LegalEntityUser, UserTypeGQL } from "@/types/User";
import { PostMedia } from "@/components/PostMedia";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ResponsiveActionMenu, ResponsiveActionMenuItem } from "@/components/ui/responsive-action-menu";
import { usePostMutations } from "@/hooks/useData/usePostData";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import EditPostDialog from "@/components/EditPostDialog";

function formatDateTime(dateStr: string, locale: string) {
  try {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
    return { time, date };
  } catch {
    return { time: "", date: "" };
  }
}

export default function PostDetailPage() {
  const params = useParams<{ id: string; lang: string }>();
  const router = useRouter();
  const postId = params?.id;
  const searchParams = useSearchParams()
  const highlightCommentId = searchParams.get("highlightComment") || undefined;
  const dict = useDictionary();
  const { open } = useNotification();
  const locale = params?.lang === "fr" ? "fr-FR" : "en-US";

  const { post, loading, error } = usePost(postId);

  const { likePost, unlikePost } = useLikePostActions(postId);
  const { me: user } = useMe();
  const { removePost, removing } = usePostMutations();
  const { addBookmark, removeBookmark } = useBookmarkActions(postId ?? '', 'Post');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url });
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
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  };

  useEffect(() => {
    document.body.classList.add("post-detail-page");
    document.body.classList.add("hide-fab");
    return () => {
      document.body.classList.remove("post-detail-page");
      document.body.classList.remove("hide-fab");
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {dict.common.back}
          </Button>
          <div className="p-10 text-center border border-border rounded-2xl bg-card">
            <h2 className="text-lg font-semibold mb-2">{dict.post.postNotFound}</h2>
            <p className="text-muted-foreground">{dict.post.deleted}</p>
          </div>
        </div>
      </div>
    );
  }

  const isLiked = post.isLiked;
  const canManagePost = post.author.id === user?.id;
  const { time, date } = formatDateTime(post.createdAt, locale);

  const handleDeletePost = async () => {
    try {
      await removePost({ variables: { id: post.id } });
      open("success", dict.post.deleteTitle, { message: dict.post.deleteSuccess });
      router.push("/");
    } catch (error) {
      open("error", dict.notifications.updateFailed.title, {
        message: error instanceof Error ? error.message : dict.notifications.updateFailed.defaultMessage,
      });
    }
  };

  const postActionItems: ResponsiveActionMenuItem[] = [
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
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <EditPostDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        post={post}
      />
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeletePost}
        title={dict.post.deleteTitle}
        message={dict.post.deleteDescription}
        confirmText={dict.actions.delete}
        cancelText={dict.common.cancel}
      />
      <style jsx global>{`
        body.post-detail-page header.md\\:hidden { display: none !important; }
        body.hide-fab .fab-button { display: none !important; }
      `}</style>

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold text-lg">{dict.post.post}</span>
      </div>

      <div className="container max-w-2xl mx-auto px-0 md:px-4 md:py-6">
        {/* Desktop Back Button */}
        <div className="hidden md:flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:bg-transparent hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> {dict.common.back}
          </Button>
        </div>

        {/* Main Post Card */}
        <Card className="overflow-hidden rounded-none border-x-0 border-t-0 shadow-none md:rounded-card md:border md:border-t md:shadow-xs">
          {/* Author Header */}
          <div className="flex items-start justify-between px-4 pb-2 pt-4">
            <div className="flex min-w-0 cursor-pointer items-center gap-3 transition-opacity hover:opacity-80" onClick={() => router.push(`/profile/${post.author.slug}`)}>
              <Avatar className="size-11 shrink-0 border border-border">
                <AvatarImage src={post.author.profilePicUrl} />
                <AvatarFallback>{getUserInitials(post.author)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold leading-tight">{getUserDisplayName(post.author)}</h3>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {post.author.userType === UserTypeGQL.INDIVIDUAL
                    ? (post.author as IndividualUser).professionalTitle
                    : dict.entityTypes[(post.author as LegalEntityUser).entityType]}
                </p>
              </div>
            </div>
            {canManagePost ? (
              <ResponsiveActionMenu
                title={dict.common.actions}
                items={postActionItems}
                trigger={
                  <Button type="button" variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </Button>
                }
              />
            ) : null}
          </div>

          {/* Content */}
          <div className="px-4 pb-2">
            <p className="mb-3 text-[13px] font-medium text-muted-foreground">
              {date} {dict.common.at || "à"} {time} · {dict.post.visibilityConnections}
            </p>
            <p className="mb-4 whitespace-pre-wrap text-[16px] leading-relaxed text-foreground">{post.content}</p>
            {post.media && post.media.length > 0 && (
              <div className="md:overflow-hidden md:rounded-card md:border md:border-border">
                <PostMedia media={post.media} />
              </div>
            )}
          </div>

          {/* Meta & actions */}
          <div className="px-4 pb-2 pt-1">
            <div className="flex items-center gap-4 text-[13px]">
              <span className="font-medium text-muted-foreground">
                <strong className="font-semibold text-foreground">{post.likesCount}</strong> {dict.post.reactions}
              </span>
              <span className="font-medium text-muted-foreground">
                <strong className="font-semibold text-foreground">{post.commentsCount}</strong> {dict.post.comments}
              </span>
            </div>
            <Separator className="my-3" />

            {/* Actions */}
            <div className="flex min-w-0 items-center justify-between text-muted-foreground md:px-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn("min-w-0 flex-1 gap-1 rounded-button px-1.5 hover:bg-error/5 hover:text-error", isLiked && "text-error")}
                onClick={() => (isLiked ? unlikePost() : likePost())}
              >
                <Heart className={cn("h-4 w-4 shrink-0", isLiked && "fill-error")} />
                <span className="min-w-0 truncate">{dict.actions.like}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-0 flex-1 gap-1 rounded-button px-1.5 hover:bg-primary/5 hover:text-primary"
                onClick={() => (post.isBookmarked ? removeBookmark() : addBookmark())}
              >
                <Bookmark className={cn("h-4 w-4 shrink-0", post.isBookmarked && "fill-primary text-primary")} />
                <span className="min-w-0 truncate">{dict.post.interesting}</span>
              </Button>
              <Button variant="ghost" size="sm" className="min-w-0 flex-1 gap-1 rounded-button px-1.5 hover:bg-primary/5 hover:text-primary" onClick={handleShare}>
                <Share2 className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{dict.actions.share}</span>
              </Button>
            </div>
          </div>
        </Card>

        <CommentThread
          postId={post.id}
          postAuthorLabel={`@${getUserDisplayName(post.author)}`}
          highlightCommentId={highlightCommentId}
        />
      </div>
    </div>
  );
}

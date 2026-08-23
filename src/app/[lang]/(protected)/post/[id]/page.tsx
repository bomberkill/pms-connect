"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePost, useMe, useBookmarkActions, useLikePostActions } from "@/hooks/useData/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Bookmark, MoreHorizontal, Pencil, Trash2, Share2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        <Card className="rounded-none md:rounded-2xl border-x-0 md:border border-t-0 md:border-t shadow-none md:shadow-xs overflow-hidden">
          {/* Author Header */}
          <div className="p-4 flex items-start justify-between">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push(`/profile/${post.author.slug}`)}>
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={post.author.profilePicUrl} />
                <AvatarFallback>{getUserInitials(post.author)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-base">{getUserDisplayName(post.author)}</h3>
                <p className="text-sm text-muted-foreground">
                  {post.author.userType === UserTypeGQL.INDIVIDUAL
                    ? (post.author as IndividualUser).professionalTitle
                    : dict.entityTypes[(post.author as LegalEntityUser).entityType]}
                </p>
              </div>
            </div>
            {canManagePost ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> {dict.actions.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteOpen(true)}
                    disabled={removing}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> {dict.actions.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {/* Content */}
          <div className="px-4 pb-2">
            <p className="text-base leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
            {post.media && post.media.length > 0 && (
              <div className="rounded-2xl overflow-hidden border border-border">
                <PostMedia media={post.media} />
              </div>
            )}
          </div>

          {/* Date & Meta */}
          <div className="px-4 py-3 mt-2">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{time}</span>
              <span>&bull;</span>
              <span>{date}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1"><strong className="text-foreground">{post.likesCount}</strong> <span className="text-muted-foreground">{dict.actions.likes}</span></span>
              <span className="flex items-center gap-1"><strong className="text-foreground">{post.commentsCount}</strong> <span className="text-muted-foreground">{dict.profile.tabs.replies}</span></span>
            </div>
            <Separator className="my-3" />

            {/* Actions */}
            <div className="flex items-center justify-between text-muted-foreground md:px-2">
              <Button variant="ghost" size="sm" className="flex-1 rounded-full hover:text-primary hover:bg-primary/5 transition-colors" onClick={() => document.getElementById('comment-input')?.focus()}>
                <MessageCircle className="h-5 w-5 mr-2" />
                {dict.profile.tabs.replies}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("flex-1 rounded-full hover:text-error hover:bg-error/5 transition-colors", isLiked && "text-error")}
                onClick={() => (isLiked ? unlikePost() : likePost())}
              >
                <Heart className={cn("h-5 w-5 mr-2", isLiked && "fill-error")} />
                {dict.actions.likes}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 rounded-full hover:text-primary hover:bg-primary/5 transition-colors"
                onClick={() => (post.isBookmarked ? removeBookmark() : addBookmark())}
              >
                <Bookmark className={cn("h-5 w-5 mr-2", post.isBookmarked && "fill-primary text-primary")} />
                {dict.actions.bookmark}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 rounded-full hover:text-primary hover:bg-primary/5 transition-colors" onClick={handleShare}>
                <Share2 className="h-5 w-5 mr-2" />
                {dict.actions.share}
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

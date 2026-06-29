"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useComments, usePost, useCommentActions, useLikePostActions, useLikeCommentActions, useComment, useCommentReplies, useMe } from "@/hooks/useData/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Bookmark, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import CommentComposer from "../../../../../components/CommentComposer";
import { uploadFileToFirebase } from "@/utils/fileUpload";
import { MediaItem, MediaType } from "@/types/Post";
import FeedItemCard from "@/components/FeedItemCard";
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
  console.log("postId", postId);
  const searchParams = useSearchParams()
  const isComment = searchParams.get("isComment") === "true"
  console.log("isComment", isComment);
  const dict = useDictionary();
  const { open } = useNotification();
  const locale = params?.lang === "fr" ? "fr-FR" : "en-US";

  const { post: postFromHook, loading: loadingPost, error: errorPost } = usePost(postId, isComment);
  const { comment, loading: commentLoading, error: commentError } = useComment(postId, isComment);

  // Determine the actual post and its ID
  const post = isComment ? comment : postFromHook
  const actualPostId = (isComment && comment && 'post' in comment ? comment.post.id : postId) || '';

  // Fetch comments or replies based on what we're viewing
  // If viewing a COMMENT (isComment=true): fetch replies to that comment, skip post comments
  // If viewing a POST (isComment=false): fetch comments for that post, skip comment replies
  const { comments: commentsFromHook, loadMore: fetchMoreComments } = useComments(actualPostId, isComment);
  const { replies, loadMore: fetchMoreReplies } = useCommentReplies(postId, isComment);

  const comments = isComment ? replies : commentsFromHook
  const loading = isComment ? commentLoading : loadingPost
  const error = isComment ? commentError : errorPost
  const fetchMore = isComment ? fetchMoreReplies : fetchMoreComments

  const { likePost, unlikePost } = useLikePostActions(postId);
  const { likeComment, unlikeComment } = useLikeCommentActions(postId);
  const { addComment, adding: isAddingComment } = useCommentActions();
  const { me: user } = useMe();
  const { removePost, removing } = usePostMutations();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("post-detail-page");
    document.body.classList.add("hide-fab");
    return () => {
      document.body.classList.remove("post-detail-page");
      document.body.classList.remove("hide-fab");
    };
  }, []);

  const handleSubmit = async (content: string, files?: File[]) => {
    if (!user) return;

    let media: MediaItem[] = [];
    try {
      if (files && files.length > 0) {
        const uploadResults = await Promise.all(
          files.map((file) =>
            uploadFileToFirebase(file, `public/${user.firebaseUid}/comments`)
          )
        );

        media = files.reduce<MediaItem[]>((acc, file, idx) => {
          const res = uploadResults[idx];
          if (res?.publicUrl) {
            const type = file.type.startsWith("video/")
              ? MediaType.VIDEO
              : file.type.startsWith("image/")
                ? MediaType.IMAGE
                : MediaType.DOCUMENT;
            acc.push({ url: res.publicUrl, type });
          }
          return acc;
        }, []);
      }

      await addComment({
        variables: {
          createCommentInput: { postId: actualPostId ?? '', content, media, parentId: isComment ? postId : undefined },
        },
      });
    } catch (error) {
      console.log("Error adding comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-96 w-full rounded-xl" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
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
          <div className="p-10 text-center border border-border rounded-xl bg-card">
            <h2 className="text-lg font-semibold mb-2">{dict.post.postNotFound}</h2>
            <p className="text-muted-foreground">{dict.post.deleted}</p>
          </div>
        </div>
      </div>
    );
  }

  const isLiked = post.isLiked;
  const canManagePost = !isComment && post.author.id === user?.id;
  const { time, date } = formatDateTime(post.createdAt, locale);

  const handleDeletePost = async () => {
    if (isComment) return;

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
      {!isComment && (
        <EditPostDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          post={post as import("@/types/Post").Post}
        />
      )}
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
        <span className="font-semibold text-lg">{isComment ? dict.profile.tabs.replies : dict.post.post}</span>
      </div>

      <div className="container max-w-3xl mx-auto px-0 md:px-4 md:py-6">
        {/* Desktop Back Button */}
        <div className="hidden md:block mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:bg-transparent hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> {dict.common.back}
          </Button>
        </div>

        {/* Main Post Card */}
        <Card className="rounded-none md:rounded-xl border-x-0 md:border-x border-t-0 md:border-t overflow-hidden">
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
              <div className="rounded-xl overflow-hidden border border-border">
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
              <Button variant="ghost" size="sm" className="flex-1 hover:text-primary hover:bg-primary/5 transition-colors" onClick={() => document.getElementById('comment-input')?.focus()}>
                <MessageCircle className="h-5 w-5 mr-2" />
                {dict.profile.tabs.replies}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("flex-1 hover:text-destructive hover:bg-destructive/5 transition-colors", isLiked && "text-destructive")}
                onClick={() => (isLiked ? isComment ? unlikeComment() : unlikePost() : isComment ? likeComment() : likePost())}
              >
                <Heart className={cn("h-5 w-5 mr-2", isLiked && "fill-current")} />
                {isLiked ? "Liked" : dict.actions.likes}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 hover:text-primary hover:bg-primary/5 transition-colors">
                <Bookmark className={cn("h-5 w-5 mr-2", post.isBookmarked && "fill-current text-primary")} />
                Save
              </Button>
            </div>
          </div>
        </Card>

        {/* Comment Composer - Desktop only */}
        <div className="hidden md:block mt-4 bg-card border border-border rounded-xl p-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">{dict.post.replyingTo} <span className="text-primary">@{getUserDisplayName(post.author)}</span></h4>
          <div id="comment-input">
            <CommentComposer user={user} isSubmitting={isAddingComment} onSubmit={handleSubmit} placeholder={dict.post.postYourReply} />
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 space-y-4">
          {comments?.length ? (
            comments.map((c) => (
              <FeedItemCard key={c.id} item={c} isComment />
            ))
          ) : (
            <div className="text-center py-10 bg-card border border-border rounded-xl">
              <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{dict.post.noComments}</p>
            </div>
          )}

          {comments?.length ? (
            <div className="flex justify-center pt-4 pb-8">
              <Button variant="outline" onClick={() => fetchMore()}>{dict.actions.loadMore}</Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Sticky Composer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-50 shadow-lg">
        <CommentComposer user={user} isSubmitting={isAddingComment} onSubmit={handleSubmit} placeholder={dict.post.postYourReply} />
      </div>
    </div>
  );
}

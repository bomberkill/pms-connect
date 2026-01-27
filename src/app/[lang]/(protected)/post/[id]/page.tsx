"use client";

import React, { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useComments, usePost, useCommentActions, useLikePostActions, useLikeCommentActions, useComment, useCommentReplies } from "@/hooks/useData/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import { useAppSelector, useDictionary } from "@/lib/hooks";
import CommentComposer from "../../../../../components/CommentComposer";
import { uploadFileToFirebase } from "@/components/Register-form";
import { MediaItem, MediaType } from "@/types/Post";
import FeedItemCard from "@/components/FeedItemCard";
import { IndividualUser, LegalEntityUser, UserTypeGQL } from "@/types/User";
import { PostMedia } from "@/components/PostMedia";

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

// function PostMedia({ media }: { media: MediaItem[] }) {
//   if (!media || media.length === 0) return null;

//   if (media.length === 1) {
//     const m = media[0];
//     return (
//       <div className="mt-3 overflow-hidden rounded-2xl">
//         {m.type === MediaType.VIDEO ? (
//           <video src={m.url} className="w-full max-h-[700px] md:max-h-[600px] bg-black rounded-2xl object-contain" controls />
//         ) : (
//           // eslint-disable-next-line @next/next/no-img-element
//           <img src={m.url} alt="Post media" className="w-full max-h-[700px] md:max-h-[600px] rounded-2xl object-cover" />
//         )}
//       </div>
//     );
//   }

//   const containerClass = cn("mt-3 grid gap-1 rounded-2xl overflow-hidden", {
//     "grid-cols-2": media.length > 1,
//   });

//   return (
//     <div className={containerClass}>
//       {media.map((m) => (
//         <div key={m.url} className="relative w-full aspect-square bg-muted">
//           {m.type === MediaType.VIDEO ? (
//             <video src={m.url} className="w-full h-full object-cover" controls />
//           ) : (
//             // eslint-disable-next-line @next/next/no-img-element
//             <img src={m.url} alt="Post media" className="w-full h-full object-cover" />
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }

export default function PostDetailPage() {
  const params = useParams<{ id: string; lang: string }>();
  const router = useRouter();
  const postId = params?.id;
  const searchParams = useSearchParams()
  const isComment = searchParams.get("isComment") === "true"
  const dict = useDictionary();
  const locale = params?.lang === "fr" ? "fr-FR" : "en-US";

  const { post: postFromHook , loading: loadingPost, error: errorPost} = usePost(postId, isComment);
  const {comment, loading: commentLoading, error: commentError} = useComment(postId, isComment);
  const { comments: commentsFromHook, loadMore: fetchMoreComments } = useComments(postId, isComment);
  const {replies, loadMore: fetchMoreReplies} = useCommentReplies(postId, isComment);
  const post = isComment ? comment : postFromHook
  const comments = isComment ? replies : commentsFromHook
  const loading = isComment ? commentLoading : loadingPost
  const error = isComment ? commentError : errorPost
  const fetchMore = isComment ? fetchMoreReplies : fetchMoreComments
  const { likePost, unlikePost } = useLikePostActions(postId);
  const { likeComment, unlikeComment } = useLikeCommentActions(postId);
  const { addComment, adding: isAddingComment } = useCommentActions();
  const finalPostId = isComment && post && 'post' in post ? post.post.id : postId
  // const {commentAdded} = useCommentSubscription(finalPostId ?? '')
  const { user } = useAppSelector((s) => s.user);
  // console.log("author :", post?.author)

  // Hide global mobile header on this page to show a custom back header instead
  useEffect(() => {
    document.body.classList.add("post-detail-page");
    return () => {
      document.body.classList.remove("post-detail-page");
    };
  }, []);

  // useEffect(() => {
  //   if(commentAdded) {
  //     fetchMore();
  //   }
  // },[commentAdded])

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
      console.log("media before adding comment: ", media)
      // const finalPostId = isComment && post && 'post' in post ? post.post.id : postId
      await addComment({
        variables: {
          createCommentInput: { postId: finalPostId ?? '', content, media, parentId: isComment ? postId : undefined},
        },
      });
    } catch (error) {
      console.log("Error adding comment:", error);
    } finally {

    }

  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-[680px] px-3 sm:px-4 md:px-0 py-4 md:py-6">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="container mx-auto max-w-[680px] px-3 sm:px-4 md:px-0 py-4 md:py-6">
        <Button variant="ghost" className="mb-4 -ml-4 md:ml-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {dict.actions.back}
        </Button>
        <p className="text-sm text-muted-foreground">{dict.post.postNotFound}</p>
      </div>
    );
  }

  const isLiked = post.isLiked;
  const { time, date } = formatDateTime(post.createdAt, locale);

  return (
    <div className="container mx-auto max-w-[680px] px-0 sm:px-2 md:px-0 bg-background md:bg-transparent md:py-4 pb-28 md:pb-0">
      <style jsx global>{`
        body.post-detail-page header.md\\:hidden { display: none !important; }
      `}</style>

      {/* Mobile header (Twitter-like) */}
      <div className="md:hidden sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 py-2 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold text-base">{dict.post.post}</span>
      </div>

      {/* Desktop back button */}
      <div className="hidden md:block px-0 py-0">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {dict.actions.back}
        </Button>
      </div>

      {/* Post content */}
      <article className="border-y md:border md:rounded-2xl bg-white md:shadow-sm overflow-hidden">
        {/* Header author row */}
        <div className="flex items-start justify-between gap-3 p-3 md:p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 md:h-12 md:w-12">
              <AvatarImage src={post.author.profilePicUrl} />
              <AvatarFallback>{getUserInitials(post.author)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm leading-tight">{getUserDisplayName(post.author)}</span>
                <span className="text-muted-foreground">·</span>
                {/* <span className="text-xs text-muted-foreground">{formatTimeAgo(post.createdAt)}</span> */}
              </div>
              <p className="text-[13px] text-muted-foreground truncate">
                {post.author.userType === UserTypeGQL.INDIVIDUAL ? (post.author as IndividualUser).professionalTitle : dict.entityTypes[(post.author as LegalEntityUser).entityType]}
              </p>
            </div>
            {/* <div className="leading-tight">
              <span className="text-sm leading-tight font-medium">{getUserDisplayName(post.author)}</span>
              <span className="truncate text-xs">{getProfessionalTitle(post.author)}</span>
            </div> */}
          </div>
          <button className="p-2 rounded-full hover:bg-muted">
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body text and media */}
        <div className="px-3 md:px-4 pb-2">
          <p className="mb-3 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.media && post.media.length > 0 && <PostMedia media={post.media} />}
        </div>

        {/* Meta: time · date · views */}
        <div className="px-3 md:px-4 py-3 text-xs md:text-sm text-muted-foreground border-t">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 [&>span:not(:first-child)]:before:content-['•'] [&>span:not(:first-child)]:before:mx-2 [&>span:not(:first-child)]:before:hidden md:[&>span:not(:first-child)]:before:inline">
            {time && <span>{time}</span>}
            {date && <span className="hidden md:inline">{date}</span>}
            {date && <span className="md:hidden">{date}</span>}
            {/* <span className="font-medium text-foreground">
              {post.viewsCount?.toLocaleString?.() ?? post.viewsCount} {viewsLabel}
            </span> */}
          </div>
        </div>

        {/* Counts row */}
        <div className="px-3 md:px-4 py-3 border-t text-xs md:text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{post.commentsCount}</span> {dict.profile.tabs.replies}
            </span>
            {/* <span>
              <span className="font-semibold text-foreground">{post.sharesCount}</span> {sharesLabel}
            </span> */}
            <span>
              <span className="font-semibold text-foreground">{post.likesCount}</span> {dict.actions.likes}
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-3 md:px-4 py-2 border-t">
          <div className="flex items-center justify-between max-w-[480px] text-muted-foreground">
            <button className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-muted">
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs md:text-sm">{post.commentsCount}</span>
            </button>
            <button className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-muted" onClick={() => (isLiked ? isComment ? unlikeComment() : unlikePost() : isComment ? likeComment() : likePost())} aria-pressed={!!isLiked}>
              <Heart className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")} />
              <span className="text-xs md:text-sm">{post.likesCount}</span>
            </button>
            {/* <button className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-muted">
              <Share2 className="h-5 w-5" />
              <span className="text-xs md:text-sm">{post.sharesCount}</span>
            </button> */}
            <button className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-muted">
              <Bookmark className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Web composer under the post (like Twitter) */}
        <div className="hidden md:block border-t px-3 md:px-4 py-4 bg-muted/20">
          <CommentComposer user={user} isSubmitting={isAddingComment} onSubmit={handleSubmit} placeholder={dict.post.postYourReply} />
        </div>
      </article>

      {/* Comments list */}
      <section className="md:mt-4 border-t md:border md:rounded-2xl bg-white md:shadow-sm overflow-hidden">
        <div className="hidden md:block border-b">
          <h3 className="text-sm font-semibold p-4">{dict.profile.tabs.replies}</h3>
        </div>
        <div className="md:p-4">
          {comments?.length ? (
            comments.map((c) => <FeedItemCard key={c.id} item={c} isComment />)
          ) : (
            <p className="text-sm text-muted-foreground">{dict.post.noComments}</p>
          )}
        </div>

        {/* Load more comments (if backend supports pagination) */}
        {comments?.length ? (
          <div className="flex justify-center p-3 md:p-4 border-t">
            <Button variant="ghost" size="sm" onClick={() => fetchMore()}>{dict.actions.loadMore}</Button>
          </div>
        ) : null}
      </section>

      {/* Mobile sticky comment composer */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50 p-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.25rem)" }}
      >
        <div className="container mx-auto max-w-[680px] px-3">
          <CommentComposer user={user} isSubmitting={isAddingComment} onSubmit={handleSubmit} placeholder={dict.post.postYourReply} />
        </div>
      </div>
    </div>
  );
}

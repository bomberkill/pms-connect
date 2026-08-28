"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useComments, useCommentReplies, useCommentActions, useCommentSubscription, useComment, useMe } from "@/hooks/useData/index";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { Button } from "@/components/ui/button";
import CommentItem from "./CommentItem";
import CommentComposer from "./CommentComposer";
import { uploadFileToR2 } from "@/utils/fileUpload";
import { MediaItem, MediaType } from "@/types/Post";

type ReplyTarget = { parentId: string; label: string };

interface RepliesBlockProps {
  parentId: string;
  highlightCommentId?: string;
  registerNode: (id: string, el: HTMLDivElement | null) => void;
  registerRefetch: (parentId: string, refetch: () => void) => void;
  onReply: (target: ReplyTarget) => void;
  onScrolledTo: (id: string) => void;
  hasScrolledRef: React.MutableRefObject<boolean>;
}

function RepliesBlock({ parentId, highlightCommentId, registerNode, registerRefetch, onReply, onScrolledTo, hasScrolledRef }: RepliesBlockProps) {
  const dict = useDictionary();
  const { replies, loading, loadMore, refetch } = useCommentReplies(parentId, true);

  useEffect(() => {
    registerRefetch(parentId, refetch);
  }, [parentId, refetch, registerRefetch]);

  useEffect(() => {
    if (hasScrolledRef.current || !highlightCommentId) return;
    if (replies.some((r) => r.id === highlightCommentId)) {
      onScrolledTo(highlightCommentId);
    }
  }, [replies, highlightCommentId, onScrolledTo, hasScrolledRef]);

  return (
    <div className="space-y-1">
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={2}
          onReply={onReply}
          highlighted={highlightCommentId === reply.id}
          ref={(el) => registerNode(reply.id, el)}
        />
      ))}
      {!loading && replies.length > 0 && replies.length % 10 === 0 && (
        <div className="ml-[56px] pb-1">
          <Button variant="ghost" size="sm" onClick={() => loadMore()}>{dict.actions.loadMore}</Button>
        </div>
      )}
    </div>
  );
}

interface CommentThreadProps {
  postId: string;
  postAuthorLabel: string;
  highlightCommentId?: string;
}

export default function CommentThread({ postId, postAuthorLabel, highlightCommentId }: CommentThreadProps) {
  const dict = useDictionary();
  const { open } = useNotification();
  const { me: user } = useMe();
  const { comments, loading, loadMore, refetch: refetchTopLevel } = useComments(postId);
  const { addComment, adding: isAddingComment } = useCommentActions();
  const { commentAdded } = useCommentSubscription(postId);

  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | undefined>(undefined);

  const replyRefetchers = useRef(new Map<string, () => void>());
  const commentNodeRefs = useRef(new Map<string, HTMLDivElement>());
  const hasScrolledRef = useRef(false);

  // Resolve a notification-provided target comment: expand its thread if it's a reply.
  const { comment: highlightTarget } = useComment(highlightCommentId, !!highlightCommentId);
  useEffect(() => {
    if (!highlightTarget?.parent?.id) return;
    setExpandedReplies((prev) => {
      if (prev.has(highlightTarget.parent!.id!)) return prev;
      const next = new Set(prev);
      next.add(highlightTarget.parent!.id!);
      return next;
    });
  }, [highlightTarget]);

  const scrollToComment = React.useCallback((id: string) => {
    if (hasScrolledRef.current) return;
    const el = commentNodeRefs.current.get(id);
    if (!el) return;
    hasScrolledRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(undefined), 2500);
  }, []);

  useEffect(() => {
    if (hasScrolledRef.current || !highlightCommentId) return;
    if (comments.some((c) => c.id === highlightCommentId)) {
      scrollToComment(highlightCommentId);
    }
  }, [comments, highlightCommentId, scrollToComment]);

  // Real-time: refetch on new activity from other users (own additions already update via cache).
  useEffect(() => {
    if (!commentAdded) return;
    refetchTopLevel();
    replyRefetchers.current.forEach((fn) => fn());
  }, [commentAdded, refetchTopLevel]);

  const registerRefetch = React.useCallback((parentId: string, refetch: () => void) => {
    replyRefetchers.current.set(parentId, refetch);
  }, []);

  const registerNode = React.useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) commentNodeRefs.current.set(id, el);
  }, []);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleReply = (target: ReplyTarget) => {
    setReplyTarget(target);
    setExpandedReplies((prev) => new Set(prev).add(target.parentId));
  };

  const handleSubmit = async (content: string, files?: File[]) => {
    if (!user) return;
    let media: MediaItem[] = [];
    try {
      if (files && files.length > 0) {
        const uploadResults = await Promise.all(files.map((file) => uploadFileToR2(file, "POST_MEDIA")));
        media = files.reduce<MediaItem[]>((acc, file, idx) => {
          const res = uploadResults[idx];
          if (res?.publicUrl) {
            const type = file.type.startsWith("video/") ? MediaType.VIDEO : file.type.startsWith("image/") ? MediaType.IMAGE : MediaType.DOCUMENT;
            acc.push({ url: res.publicUrl, type });
          }
          return acc;
        }, []);
      }

      await addComment({
        variables: {
          createCommentInput: { postId, content, media, parentId: replyTarget?.parentId },
        },
      });

      if (replyTarget) {
        setExpandedReplies((prev) => new Set(prev).add(replyTarget.parentId));
      }
      setReplyTarget(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      open("error", dict.notifications.updateFailed.title, {
        message: error instanceof Error ? error.message : dict.notifications.updateFailed.defaultMessage,
      });
    }
  };

  return (
    <>
      {/* Comment Composer - Desktop only */}
      <div className="mt-4 hidden rounded-card border border-border bg-card p-4 md:block">
        <h4 className="mb-3 text-sm font-medium text-muted-foreground">
          {dict.post.replyingTo} <span className="text-primary">{replyTarget ? replyTarget.label : postAuthorLabel}</span>
        </h4>
        <div id="comment-input">
          <CommentComposer
            user={user}
            isSubmitting={isAddingComment}
            onSubmit={handleSubmit}
            placeholder={dict.post.postYourReply}
            replyingTo={replyTarget ? { label: replyTarget.label } : undefined}
            onCancelReply={() => setReplyTarget(null)}
          />
        </div>
      </div>

      {/* Comments Section */}
      <section className="mt-3 border-y border-border bg-card px-4 py-3 md:rounded-card md:border">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="font-heading text-[17px] font-semibold tracking-tight">{dict.post.commentsTitle}</h2>
          <button type="button" className="text-xs font-semibold text-muted-foreground">
            {dict.post.relevantComments}
          </button>
        </div>
        {comments?.length ? (
          comments.map((c) => (
            <div key={c.id} className="border-t border-border first:border-t-0">
              <CommentItem
                comment={c}
                depth={1}
                repliesExpanded={expandedReplies.has(c.id)}
                onToggleReplies={() => toggleReplies(c.id)}
                onReply={handleReply}
                highlighted={highlightedId === c.id}
                ref={(el) => registerNode(c.id, el)}
              />
              {expandedReplies.has(c.id) && (
                <RepliesBlock
                  parentId={c.id}
                  highlightCommentId={highlightCommentId}
                  registerNode={registerNode}
                  registerRefetch={registerRefetch}
                  onReply={handleReply}
                  onScrolledTo={scrollToComment}
                  hasScrolledRef={hasScrolledRef}
                />
              )}
            </div>
          ))
        ) : !loading ? (
          <div className="py-10 text-center">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{dict.post.noComments}</p>
          </div>
        ) : null}

        {comments?.length ? (
          <div className="flex justify-center pb-4 pt-4">
            <Button variant="outline" onClick={() => loadMore()}>{dict.actions.loadMore}</Button>
          </div>
        ) : null}
      </section>

      {/* Mobile Sticky Composer */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-3 shadow-[0_-10px_30px_-18px_rgba(11,15,20,.45)] md:hidden">
        <CommentComposer
          user={user}
          isSubmitting={isAddingComment}
          onSubmit={handleSubmit}
          placeholder={dict.post.postYourReply}
          replyingTo={replyTarget ? { label: replyTarget.label } : undefined}
          onCancelReply={() => setReplyTarget(null)}
        />
      </div>
    </>
  );
}

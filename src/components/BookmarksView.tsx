"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bookmark as BookmarkIcon, Loader2 } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { useMyBookmarks } from "@/hooks/useData/useBookmarkData";
import { Bookmark } from "@/types/Bookmark";
import { Post } from "@/types/Post";
import { Comment } from "@/types/Comment";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FeedItemCard from "@/components/FeedItemCard";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";

function isCommentItem(item: Post | Comment): item is Comment {
  return "post" in item;
}

function BookmarkedCommentCard({ comment }: { comment: Comment }) {
  const router = useRouter();
  const dict = useDictionary();

  return (
    <button
      type="button"
      onClick={() => router.push(`/post/${comment.post.id}`)}
      className="w-full text-left rounded-card border border-border bg-card px-4 py-3 mb-3 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.profilePicUrl} />
          <AvatarFallback>{getUserInitials(comment.author)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{getUserDisplayName(comment.author)}</span>
            <span className="text-2xs text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
              {dict.bookmarks.commentBadge}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </button>
  );
}

export default function BookmarksView() {
  const dict = useDictionary();
  const { bookmarks, loading, loadMore } = useMyBookmarks();

  if (loading && bookmarks.length === 0) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{dict.bookmarks.title}</h1>
        <p className="text-muted-foreground">{dict.bookmarks.subtitle}</p>
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title={dict.bookmarks.emptyTitle}
          description={dict.bookmarks.emptyDescription}
        />
      ) : (
        <div>
          {bookmarks.map((bookmark: Bookmark) =>
            isCommentItem(bookmark.item) ? (
              <BookmarkedCommentCard key={bookmark.id} comment={bookmark.item} />
            ) : (
              <FeedItemCard key={bookmark.id} item={bookmark.item} />
            )
          )}
          <div className="flex justify-center pt-2 pb-8">
            <Button variant="outline" onClick={() => loadMore()}>{dict.actions.loadMore}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

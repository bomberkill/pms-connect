"use client";

import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useFeed, useNewFeedItemsCount } from "@/hooks/useData/index";
import { Skeleton } from "./ui/skeleton";
import FeedItemCard from "./FeedItemCard";

const PostSkeleton = () => (
  <div className="border rounded-xl bg-white shadow-sm p-4 mb-6">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-3 w-[100px]" />
      </div>
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4 mb-4" />
    <Skeleton className="h-40 w-full rounded-lg" />
  </div>
);

export const Feed = () => {
  const [lastPostDate, setLastPostDate] = useState<Date | undefined>(undefined);
  const { count, refreshCount } = useNewFeedItemsCount(lastPostDate);
  const { posts, loading, error, loadMore, refresh } = useFeed({ limit: 15 });
  const { ref, inView } = useInView({ threshold: 0.5 });

   useEffect(() => {
    if (posts.length > 0) {
      // Take the latest post date (first in the feed)
      setLastPostDate(new Date(posts[0].createdAt));
    }
  }, [posts]);
  useEffect(() => {
    const interval = setInterval(() => refreshCount(), 60000); // every 30s
    return () => clearInterval(interval);
  }, [refreshCount]);
  useEffect(() => {
    if (inView && !loading) loadMore();
  }, [inView, loading, loadMore]);

  if (loading && posts.length === 0) {
    return <div>{[...Array(2)].map((_, i) => <PostSkeleton key={i} />)}</div>;
  }

  if (error) return <p>Error loading feed: {error.message}</p>;

  return (
    <div>
      {count > 0 && (
        <div
          className="sticky top-0 z-10 bg-blue-600 text-white text-center py-2 cursor-pointer"
          onClick={async() => {
            await refresh();   // recharge les posts
            refreshCount();   // manually trigger reload of the feed
          }}
        >
          {count} new post{count > 1 ? "s" : ""} available — click to refresh 🔄
        </div>
      )}
      {posts.map((post) => (
        <FeedItemCard key={post.id} item={post} />
      ))}
      <div ref={ref} style={{ height: "10px" }} />
      {loading && posts.length > 0 && <PostSkeleton />}
    </div>
  );
};

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useFeed, useNewFeedItemsCount } from "@/hooks/useData/index";
import { Skeleton } from "./ui/skeleton";
import FeedItemCard from "./FeedItemCard";
import { Loader2, WifiOff } from "lucide-react";
import { Button } from "./ui/button";

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
  const PULL_THRESHOLD = 70; // Distance en pixels à tirer pour déclencher le rafraîchissement
  const [lastPostDate, setLastPostDate] = useState<Date | undefined>(undefined);
  const { count, refreshCount } = useNewFeedItemsCount(lastPostDate);
  const { posts, loading, error, loadMore, refresh } = useFeed({ limit: 15 });
  const { ref, inView } = useInView({ threshold: 0.5 });

  // États pour le "Pull to Refresh"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullPosition, setPullPosition] = useState(0);
  const touchStartRef = useRef(0);
  const isAtTopRef = useRef(true);

  const handleRefresh = async () => {
    console.log("Refreshing...");
    if (isRefreshing) return;
    console.log("Refreshing2...");
    setIsRefreshing(true);
    await refresh();
    console.log("Refreshing3...");
    refreshCount(); // Réinitialise aussi le compteur de nouveaux posts
    console.log("Refreshing4...");
    setIsRefreshing(false);
    setPullPosition(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      isAtTopRef.current = true;
      touchStartRef.current = e.touches[0].clientY;
    } else {
      isAtTopRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isAtTopRef.current) return;

    const touchY = e.touches[0].clientY;
    const pullDistance = touchY - touchStartRef.current;

    if (pullDistance > 0) {
      // Appliquer une résistance pour un effet plus naturel
      setPullPosition(pullDistance / 2.5);
    }
  };

  const handleTouchEnd = () => {
    if (!isAtTopRef.current) return;

    if (pullPosition > PULL_THRESHOLD) {
      handleRefresh();
    }
    setPullPosition(0); // Réinitialiser la position dans tous les cas
  };

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

  if (error) {
    const isNetworkError = error.message.toLowerCase().includes('failed to fetch');
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-20rem)] gap-4 text-center p-4">
        <WifiOff className="w-16 h-16 text-destructive" />
        <h2 className="text-xl font-bold">Impossible de charger le fil d'actualité</h2>
        <p className="text-muted-foreground">
          {isNetworkError
            ? "Veuillez vérifier votre connexion internet et réessayer."
            : "Une erreur s'est produite. Veuillez réessayer plus tard."}
        </p>
        <Button onClick={() => refresh()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Indicateur de rafraîchissement */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden text-muted-foreground transition-all duration-300"
        style={{
          height: `${pullPosition}px`,
          opacity: Math.min(pullPosition / PULL_THRESHOLD, 1),
          transform: `translateY(-100%)`, // Positionné au-dessus du contenu
        }}
      >
        <Loader2 className={`animate-spin ${isRefreshing ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {count > 0 && (
        <div
          className="sticky top-20 z-10 mx-auto w-fit bg-blue-600 text-white text-center text-sm truncate py-2 px-4 cursor-pointer rounded-3xl shadow-lg"
          onClick={handleRefresh}
        >
          {count} nouveau{count > 1 ? "x" : ""} post{count > 1 ? "s" : ""} disponible{count > 1 ? "s" : ""}
        </div>
      )}

      {posts.map((post) => (
        <FeedItemCard key={post.id} item={post} />
      ))}
      <div ref={ref} style={{ height: "10px" }} />
    </div>
  );
};

'use client';

import React, { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useFeed } from "@/hooks/useData/index";
import { Skeleton } from "./ui/skeleton";
import FeedItemCard from "./FeedItemCard";
import { Loader2, WifiOff } from "lucide-react";
import { Button } from "./ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { NewPostsBadge } from "./feed/NewPostsBadge";
import { useDictionary } from "@/hooks/use-dictionary";

const PostSkeleton = () => (
  <div className="border border-border rounded-xl bg-card shadow-sm p-4 mb-6">
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
  const dict = useDictionary();
  const PULL_THRESHOLD = 70; // Distance en pixels à tirer pour déclencher le rafraîchissement

  // Use enhanced useFeed with polling and new posts detection
  const {
    posts,
    loading,
    error,
    loadMore,
    refresh,
    newPostsCount,
    loadNewPosts,
    isLoadingNewPosts
  } = useFeed({ limit: 15, enablePolling: true });

  const { ref, inView } = useInView({ threshold: 0.5 });

  // Badge state
  const [showBadge, setShowBadge] = useState(false);

  // Show badge when new posts are detected
  useEffect(() => {
    if (newPostsCount > 0) {
      setShowBadge(true);
    }
  }, [newPostsCount]);

  // États pour le "Pull to Refresh"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullPosition, setPullPosition] = useState(0);
  const touchStartRef = useRef(0);
  const isAtTopRef = useRef(true);

  /**
   * Handle new posts badge click (Twitter-style)
   * Scrolls immediately for instant feedback, then loads new posts
   */
  const handleLoadNewPosts = async () => {
    setShowBadge(false);
    // Scroll immediately for instant feedback (don't wait for data)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Then load new posts in background
    await loadNewPosts();
  };

  const handleRefresh = async () => {
    console.log("Refreshing...");
    if (isRefreshing) return;
    console.log("Refreshing2...");
    setIsRefreshing(true);
    await loadNewPosts(); // Use loadNewPosts instead of refresh
    console.log("Refreshing3...");
    setShowBadge(false); // Hide badge after manual refresh
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
        <h2 className="text-xl font-bold">{dict.feed.errorTitle}</h2>
        <p className="text-muted-foreground">
          {isNetworkError
            ? dict.feed.networkError
            : dict.feed.genericError}
        </p>
        <Button onClick={() => refresh()}>
          {dict.feed.retry}
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
      {/* New Posts Badge (Twitter-style) */}
      <NewPostsBadge
        count={newPostsCount}
        onClick={handleLoadNewPosts}
        show={showBadge}
      />

      {/* Loading indicator for new posts (shown only if prefetch incomplete) */}
      {isLoadingNewPosts && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 
                        bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full 
                        shadow-lg border border-border flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          {/* <span className="text-sm text-muted-foreground">Chargement...</span> */}
        </div>
      )}

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

      {/* Feed posts */}
      <AnimatePresence initial={false}>
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <FeedItemCard item={post} />
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={ref} style={{ height: "10px" }} />
    </div>
  );
};

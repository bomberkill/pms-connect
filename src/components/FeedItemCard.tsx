"use client";

import React from "react";
import {
  Ban,
  Bookmark,
  Flag,
  Heart,
  MessageCircle,
  MoreVertical,
  Share2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBookmarkActions, useFollowActions, useMe, useLikeCommentActions, useLikePostActions, useLikesSubscription } from "@/hooks/useData/index"
import { useIsMobile } from "@/hooks/use-mobile";
import { useDictionary } from "@/hooks/use-dictionary";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import { Comment } from "@/types/Comment";
import { Post } from "@/types/Post";
import { IndividualUser, LegalEntityUser, UserTypeGQL } from "@/types/User";
import { useRouter } from "next/navigation";
import { PostMedia } from "./PostMedia";

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

// export function PostMedia({ media }: { media?: MediaItem[] }) {
//   const dict = useDictionary()
//   if (!media || media.length === 0) return null;

//   if (media.length === 1) {
//     const m = media[0];
//     return (
//       <div className="mt-3 overflow-hidden">
//         {m.type === MediaType.VIDEO ? (
//           <video src={m.url} className="w-full max-h-[520px] bg-black rounded-md object-contain" controls onClick={(e) => e.stopPropagation()} />
//         ) : m.type === MediaType.IMAGE ? (
//           // eslint-disable-next-line @next/next/no-img-element
//           <img src={m.url} alt="Post media" className="w-full max-h-[520px] rounded-md object-cover" />
//         ) : (
//           <a href={m.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 p-4 bg-muted rounded-lg border hover:bg-muted/80">
//             <FileIcon className="h-8 w-8 text-muted-foreground" />
//             <div className="flex flex-col">
//               <span className="text-sm font-medium text-foreground break-all">{m.url.split("/").pop()}</span>
//               <span className="text-xs text-muted-foreground">{dict.post.pdfDocument}</span>
//             </div>
//           </a>
//         )}
//       </div>
//     );
//   }

//   // const containerClass = cn("mt-3 grid gap-1 rounded-lg overflow-hidden", {
//   //   "grid-cols-2": media.length > 1,
//   // });

//   return (
//     <div className={cn("mt-3 grid gap-1 overflow-hidden", {
//       "grid-cols-2": media.length === 2,
//       "grid-cols-3": media.length === 3,
//       "grid-cols-4": media.length >= 4,
//     })}>
//       {media.map((m) => {
//         if (m.type === MediaType.VIDEO) {
//           return <video key={m.url} src={m.url} className="w-full h-full rounded-md object-cover" controls onClick={(e) => e.stopPropagation()} />;
//         }
//         if (m.type === MediaType.IMAGE) {
//           return <img key={m.url} src={m.url} alt="Post media" className="w-full h-full rounded-md object-cover" />;
//         }
//         // For documents in a grid
//         return (
//           <a key={m.url} href={m.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-full aspect-square bg-muted rounded-md flex flex-col items-center justify-center p-2 hover:bg-muted/80">
//             <FileIcon className="h-10 w-10 text-muted-foreground" />
//             <span className="text-xs text-muted-foreground text-center break-all mt-2">{m.url.split('/').pop()}</span>
//           </a>
//         );
//       })}
//       {/* TODO: Implement a proper media grid for more than 2 items */}
//     </div>
//   );
// }

interface FeedItemCardProps {
  item: Post | Comment;
  isComment?: boolean;
}

export default function FeedItemCard({ item, isComment = false }: FeedItemCardProps) {
  const dict = useDictionary();
  const router = useRouter();
  const { me } = useMe();
  const isMobile = useIsMobile();

  const authorId = item.author?.id;
  const { likePost, unlikePost, liking, unliking } = useLikePostActions(item.id);
  const { likeComment, unlikeComment } = useLikeCommentActions(item.id);
  const { likesUpdate } = useLikesSubscription(item.id, isComment ? 'Comment' : 'Post');
  const { followUser, unfollowUser, following: followingReq, unfollowing } = useFollowActions();
  const { addBookmark, removeBookmark, adding: addingBookmark, removing: removingBookmark } = useBookmarkActions(item.id, isComment ? 'Comment' : 'Post');

  const isLiked = 'isLiked' in item ? item.isLiked : false;
  const isFollowing = !!(authorId && me?.following?.includes(authorId));
  React.useEffect(() => {
    if (likesUpdate) {
      // Optionally handle real-time like updates here
    }
  }, [likesUpdate]);

  const handleLikeToggle = () => {
    if (isComment) {
      console.log("is comment and id: ", item.id)
      if (isLiked) unlikeComment();
      else likeComment();
    } else {
      console.log("is post and id: ", item.id)
      if (isLiked) unlikePost();
      else likePost();
    }
  };

  const handleFollowToggle = async () => {
    if (!authorId) return;
    try {
      if (isFollowing) await unfollowUser({
        variables: {
          userId: authorId,
        }
      });
      else await followUser({
        variables: {
          userId: authorId,
        }
      });
    } catch (e) {
      console.error("Follow/unfollow failed", e);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!me) return;
    try {
      if (item.isBookmarked) {
        await removeBookmark();
      } else {
        await addBookmark();
      }
    } catch (e) {
      console.error("Bookmark toggle failed", e);
    }
  };
  const goToDetail = () => {
    const postPath = isComment ? `/post/${item.id}?isComment=true` : `/post/${item.id}`;
    router.push(postPath);
  };

  return (
    <div className={cn(
      "bg-card text-card-foreground overflow-hidden transition-all duration-200",
      isMobile ? "border-b border-border pb-2 mb-2" : isComment ? "border-b border-border py-4" : "border border-border rounded-2xl shadow-sm hover:shadow-md my-6"
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        <div onClick={() => router.push(`/profile/${item.author.slug}`)} className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage className="object-cover" src={item.author.profilePicUrl} />
            <AvatarFallback>{getUserInitials(item.author)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm leading-tight">{getUserDisplayName(item.author)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{formatTimeAgo(item.createdAt, dict)}</span>
            </div>
            <p className="text-[13px] text-muted-foreground truncate">
              {item.author.userType === UserTypeGQL.INDIVIDUAL ? (item.author as IndividualUser).professionalTitle : dict.entityTypes[(item.author as LegalEntityUser).entityType]}
            </p>
          </div>
        </div>
        {!isComment && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="More options" className="p-1 rounded-md hover:bg-muted">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{dict.common.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer"><Ban className="mr-2 h-4 w-4" /> {dict.actions.mute}</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer"><Flag className="mr-2 h-4 w-4" /> {dict.actions.report}</DropdownMenuItem>
              {authorId && authorId !== me?.id && (
                <DropdownMenuItem className="cursor-pointer" onClick={handleFollowToggle} disabled={followingReq || unfollowing}>{isFollowing ? <><UserMinus className="mr-2 h-4 w-4" /> {dict.actions.unfollow}</> : <><UserPlus className="mr-2 h-4 w-4" /> {dict.actions.follow}</>}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="px-4 pb-2">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
        {'media' in item && <PostMedia media={item.media} />}
      </div>

      <div className="flex items-center justify-between px-4 py-2 text-muted-foreground">
        <div className="flex items-center justify-start gap-1">
          <button onClick={handleLikeToggle} disabled={liking || unliking} className="flex items-center justify-center gap-2 hover:bg-muted/80 rounded-full px-3 py-2 transition-colors" aria-label={isLiked ? dict.actions.unlike : dict.actions.like} aria-pressed={!!isLiked}>
            <Heart className={cn("size-5", isLiked && "fill-red-500 text-red-500")} />
            <span className="text-sm font-medium tabular-nums">{'likesCount' in item ? item.likesCount : 0}</span>
          </button>
          <button onClick={goToDetail} className="flex items-center justify-center gap-2 hover:bg-muted/80 rounded-full px-3 py-2 transition-colors" aria-label={dict.actions.comment}>
            <MessageCircle className="size-5" />
            <span className="text-sm font-medium tabular-nums">{'commentsCount' in item ? item.commentsCount : 0}</span>
          </button>
          {!isComment && (
            <button className="flex items-center justify-center gap-2 hover:bg-muted/80 rounded-full px-3 py-2 transition-colors" aria-label={dict.actions.share}>
              <Share2 className="size-5" />
            </button>
          )}
        </div>
        {!isComment && (
          <button
            onClick={handleBookmarkToggle}
            disabled={addingBookmark || removingBookmark}
            className="flex items-center justify-center gap-2 hover:bg-muted/80 rounded-full px-3 py-2 transition-colors"
            aria-label={item.isBookmarked ? dict.actions.removeBookmark : dict.actions.bookmark}
          >
            <Bookmark className={cn("size-5", item.isBookmarked && "fill-primary text-primary")} />
          </button>
        )}
      </div>
    </div>
  );
}

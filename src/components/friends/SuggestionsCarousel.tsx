"use client";

import React from "react";
import { User } from "@/types/User";
import { useRouter } from "next/navigation";
import { useDictionary } from "@/hooks/use-dictionary";
import UserCard from "../UserCard";

interface Props {
  suggestions?: User[];
}

export function SuggestionsCarousel({ suggestions = [] }: Props) {
  // const {followUser} = useFollowActions()
  const dict = useDictionary();
  const router = useRouter();
  const toProfile = (slug: string) => {
    router.push( `/profile/${slug}`);
  }
  if (!suggestions.length) {
    return <p className="text-xs text-muted-foreground">{dict.friends.noSuggestions}</p>;
  }

  return (
    // <Carousel
    //   opts={{
    //     align: "start",
    //     loop: true,
    //     dragFree: true,
    //   }}
    //   className="w-full px-12"
    // >
    //   <CarouselContent className="-ml-2">
    //     {suggestions.map((friend, index) => (
    //       <CarouselItem
    //         onClick={() => toProfile(friend.slug)}
    //         key={index}
    //         className="cursor-pointer basis-1/2 sm:basis-1/3 lg:basis-1/4 pl-2"
    //       >
    //         <UserCard friend={friend} />
    //         {/* <Card className="p-3 flex flex-col items-center text-center">
    //           <Avatar className="h-20 w-20 rounded-full">
    //             <AvatarImage
    //               src={friend.profilePicUrl}
    //               alt={getUserDisplayName(friend)}
    //               className="object-cover"
    //             />
    //             <AvatarFallback>{getUserInitials(friend)}</AvatarFallback>
    //           </Avatar>

    //           <CardContent className="p-0 w-full">
    //             <Link href={`/profile/${friend.slug}`}>
    //               <h3 className="text-sm font-medium hover:underline">
    //                 {getUserDisplayName(friend)}
    //               </h3>
    //             </Link>
    //             <p className="text-xs text-muted-foreground truncate">
    //               {friend.userType === UserTypeGQL.INDIVIDUAL
    //                 ? friend.professionalTitle
    //                 : friend.entityType}
    //             </p>
    //             <div className="flex justify-center gap-2 mt-2">
    //               <Button
    //                 className="cursor-pointer"
    //                 onClick={() => followUser({ variables: { userId: friend.id } })}
    //                 size="sm"
    //                 variant="default"
    //               >
    //                 Suivre
    //               </Button>
    //             </div>
    //           </CardContent>
    //         </Card> */}
    //       </CarouselItem>
    //     ))}
    //   </CarouselContent>
    //   <CarouselPrevious className="-left-0" />
    //   <CarouselNext className="-right-0" />
    // </Carousel>
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div
        className="flex gap-3 snap-x snap-mandatory px-2"
        style={{
          scrollSnapType: "x mandatory",
        }}
      >
        {suggestions.map((friend, index) => (
          <div
            key={index}
            onClick={() => toProfile(friend.slug)}
            className="flex-shrink-0 snap-start cursor-pointer w-1/3 sm:w-1/4 lg:w-1/5"
          >
            <UserCard friend={friend} />
          </div>
        ))}
      </div>
    </div>
            // <UserCard friend={friend} />

  );
}

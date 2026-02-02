"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { ArrowUpRight, Bell, MessageCircle, Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { User, UserTypeGQL } from "@/types/User";
import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { useFollowActions, useUsers, useMe } from "@/hooks/useData/index";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { useIsTablet } from "@/hooks/use-mobile";

// Un composant réutilisable pour afficher une suggestion
export const SuggestionItem = ({
  friend
}: {
  friend: User
}) => (
  <Link href={`/profile/${friend.slug}`}>
    <div className="flex items-center gap-2 py-2">
      <div className="h-8 w-8">
        <Avatar className="h-full w-full rounded-full">
          <AvatarImage className="object-cover" src={friend.profilePicUrl} alt={getUserDisplayName(friend)} />
          <AvatarFallback className="rounded-full">{getUserInitials(friend)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{getUserDisplayName(friend)}</span>
        <span className="truncate text-xs">{friend.userType === UserTypeGQL.INDIVIDUAL ? friend.professionalTitle : friend.entityType}</span>
      </div>
      {/* <Plus className="ml-auto size-4 text-muted-foreground" /> */}
      {/* <div className="size-10 rounded-full bg-muted" /> */}
    </div>
  </Link>
);

export function SuggestionsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Données factices pour l'exemple
  const router = useRouter()
  const isTablet = useIsTablet();
  // const { user, loading: userLoading } = useAppSelector((state) => state.user);
  const { me: user, loading: userLoading } = useMe();
  const dict = useDictionary();

  // On utilise notre hook personnalisé. La logique est encapsulée et réutilisable.
  const { suggestions: suggestedFriends, loading: loadingSuggestions, error } = useUsers({ limit: 5 });
  const { followUser } = useFollowActions()

  if (error) {
    console.error("Error fetching suggestions:", error);
    // On pourrait afficher un message d'erreur ici
  }

  const headerButtons = [
    {
      icon: MessageCircle,
      onClick: () => {
        router.push("/messages")
      }
    },
    {
      icon: Bell,
      onClick: () => {
        router.push("/notifications")
      }

    },
    {
      icon: Settings,
      onClick: () => {
        router.push("/settings")
      }
    }
  ]


  if (!isTablet) {
    return (
      <Sidebar className="bg-background" side="right" variant="sidebar" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between p-2">
                {!user || userLoading ? (
                  <Skeleton className="h-8 w-8 rounded-lg" />
                ) : (
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage className="object-cover" src={user.profilePicUrl} alt={getUserDisplayName(user)} />
                    <AvatarFallback className="rounded-md">CN</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex items-center gap-1 justify-center">
                  {headerButtons.map((button, index) => (
                    <SidebarMenuButton className="border-border rounded-full border shadow-sm hover:bg-muted/80 transition-colors h-8 w-8 p-0 flex items-center justify-center" key={index} onClick={button.onClick}>
                      <button.icon className="size-4" />
                    </SidebarMenuButton>
                  ))}
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <Separator />
        <SidebarContent>
          {loadingSuggestions ? (
            <div className="p-4">
              <Skeleton className="mb-2 h-4 w-3/4 rounded-md" />
              {[...Array(3)].map((_, index) => (
                <div key={index} className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-4 w-1/2 rounded-md" />
                    <Skeleton className="h-3 w-1/3 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              ))}
            </div>
          ) : suggestedFriends.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {dict.friends.noSuggestions}
            </div>
          ) :
            <>
              <SidebarGroup className="py-0 px-4">
                <div className="flex items-center justify-between py-2">
                  <SidebarGroupLabel>{dict.friends.suggestions}</SidebarGroupLabel>
                  <SidebarGroupLabel className="text-primary cursor-pointer">{dict.actions.seeAll} <ArrowUpRight className="pl-1" /></SidebarGroupLabel>
                </div>
                <Separator />
                <SidebarGroupContent className="py-0">
                  {suggestedFriends.filter((item) => item.id !== user?.id).map((friend) => (
                    <div key={friend.id}>
                      <div className="flex items-center">
                        <SuggestionItem friend={friend} />
                        <Plus onClick={() => followUser({ variables: { userId: friend.id } })} className=" cursor-pointer ml-auto size-4 text-muted-foreground" />
                      </div>
                      <Separator />
                    </div>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          }
        </SidebarContent>
      </Sidebar>
    );
  }

}
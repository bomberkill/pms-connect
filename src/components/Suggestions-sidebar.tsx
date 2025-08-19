"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { ArrowUpRight, Bell, MessageCircle, Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAppSelector, } from "@/lib/hooks";
import { Skeleton } from "./ui/skeleton";
import { AccountStatusGQL, EntityTypeGQL, SpecialityGQL, User, UserTypeGQL } from "@/types/User";

// Un composant réutilisable pour afficher une suggestion
const SuggestionItem = ({
  friend
}: {
  friend: User
}) => (
  <div className="flex items-center gap-2 py-2">
    <div className="h-8 w-8">
      <Avatar className="h-full w-full rounded-full">
        <AvatarImage className="object-cover" src={friend.profilePicUrl} alt={friend.userType === UserTypeGQL.INDIVIDUAL ? friend.firstName : friend.entityName } />
        <AvatarFallback className="rounded-full">CN</AvatarFallback>
      </Avatar>
    </div>
    <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{friend.userType === UserTypeGQL.INDIVIDUAL ? `${friend.firstName} ${friend.lastName}` : friend.entityName}</span>
        <span className="truncate text-xs">{friend.userType === UserTypeGQL.INDIVIDUAL ? friend.professionalTitle : friend.entityType}</span>
    </div>
    <Plus className="ml-auto size-4 text-muted-foreground" />
    {/* <div className="size-10 rounded-full bg-muted" /> */}
  </div>
);

export function SuggestionsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Données factices pour l'exemple
  const router = useRouter()
  // const dict = useDictionary()
  const {user, loading} = useAppSelector((state) => state.user)

    const friends: User[] = [
  {
    _id: "66c9b8b6f1a1e9001c1e001a",
    firebaseUid: "firebase-uid-1",
    email: "john.doe@example.com",
    userType: UserTypeGQL.INDIVIDUAL,
    firstName: "John",
    lastName: "Doe",
    speciality: SpecialityGQL.CAREGIVERS,
    professionalTitle: "Full Stack Developer",
    professionalAccreditation: [],
    profilePicUrl: "https://example.com/profiles/john.jpg",
    coverPicUrl: "https://example.com/covers/john-cover.jpg",
    bio: "Passionate about coding and building scalable applications.",
    location: { city: "Paris", country: "France" },
    websiteUrl: "https://johndoe.dev",
    accountStatus: AccountStatusGQL.ACTIVE,
    connections: [],
    followers: [],
    following: [],
    blockedUsers: [],
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-02-15T14:00:00Z",
    lastLoginAt: "2025-02-15T14:00:00Z"
  },
  {
    _id: "66c9b8b6f1a1e9001c1e001b",
    firebaseUid: "firebase-uid-2",
    email: "jane.smith@business.com",
    userType: UserTypeGQL.LEGAL_ENTITY,
    entityName: "Smith Consulting",
    entityType: EntityTypeGQL.ASSOCIATION,
    professionalAccreditation: [],
    profilePicUrl: "https://example.com/profiles/smith.jpg",
    coverPicUrl: "https://example.com/covers/smith-cover.jpg",
    bio: "Providing business and IT consulting services worldwide.",
    location: { city: "New York", country: "USA" },
    websiteUrl: "https://smithconsulting.com",
    accountStatus: AccountStatusGQL.ACTIVE,
    connections: [],
    followers: [],
    following: [],
    blockedUsers: [],
    createdAt: "2025-01-05T09:00:00Z",
    updatedAt: "2025-02-12T11:00:00Z",
    lastLoginAt: "2025-02-12T11:00:00Z"
  },
  {
    _id: "66c9b8b6f1a1e9001c1e001c",
    firebaseUid: "firebase-uid-3",
    email: "alice.wang@example.com",
    userType: UserTypeGQL.INDIVIDUAL,
    firstName: "Alice",
    lastName: "Wang",
    speciality: SpecialityGQL.DENTAL_SURGEONS,
    professionalTitle: "Creative Director",
    professionalAccreditation: [],
    profilePicUrl: "https://example.com/profiles/alice.jpg",
    coverPicUrl: "https://example.com/covers/alice-cover.jpg",
    bio: "Designing experiences that inspire.",
    location: { city: "Toronto", country: "Canada" },
    websiteUrl: "https://alicewang.design",
    accountStatus: AccountStatusGQL.ACTIVE,
    connections: [],
    followers: [],
    following: [],
    blockedUsers: [],
    createdAt: "2025-01-20T13:00:00Z",
    updatedAt: "2025-02-14T09:00:00Z",
    lastLoginAt: "2025-02-14T09:00:00Z"
  },
  {
    _id: "66c9b8b6f1a1e9001c1e001d",
    firebaseUid: "firebase-uid-4",
    email: "marco.rossi@example.com",
    userType: UserTypeGQL.INDIVIDUAL,
    firstName: "Marco",
    lastName: "Rossi",
    speciality: SpecialityGQL.PUBLIC_HEALTH_ADMINISTRATION,
    professionalTitle: "Travel Photographer",
    professionalAccreditation: [],
    profilePicUrl: "https://example.com/profiles/marco.jpg",
    coverPicUrl: "https://example.com/covers/marco-cover.jpg",
    bio: "Capturing moments from around the world.",
    location: { city: "Rome", country: "Italy" },
    websiteUrl: "https://marcorossi.photos",
    accountStatus: AccountStatusGQL.ACTIVE,
    connections: [],
    followers: [],
    following: [],
    blockedUsers: [],
    createdAt: "2025-02-01T08:30:00Z",
    updatedAt: "2025-02-13T16:45:00Z",
    lastLoginAt: "2025-02-13T16:45:00Z"
  },
  {
    _id: "66c9b8b6f1a1e9001c1e001e",
    firebaseUid: "firebase-uid-5",
    email: "creative.agency@example.com",
    userType: UserTypeGQL.LEGAL_ENTITY,
    entityName: "Creative Minds Agency",
    entityType: EntityTypeGQL.CLINIC,
    professionalAccreditation: [],
    profilePicUrl: "https://example.com/profiles/agency.jpg",
    coverPicUrl: "https://example.com/covers/agency-cover.jpg",
    bio: "Helping brands tell their story through innovative campaigns.",
    location: { city: "Berlin", country: "Germany" },
    websiteUrl: "https://creativeminds.agency",
    accountStatus: AccountStatusGQL.ACTIVE,
    connections: [],
    followers: [],
    following: [],
    blockedUsers: [],
    createdAt: "2025-01-15T10:15:00Z",
    updatedAt: "2025-02-11T15:20:00Z",
    lastLoginAt: "2025-02-11T15:20:00Z"
  },
  {
    _id: "66c9b8b6f1a1e9001c1e001f",
    firebaseUid: "firebase-uid-6",
    email: "emily.clark@example.com",
    userType: UserTypeGQL.INDIVIDUAL,
    firstName: "Emily",
    lastName: "Clark",
    speciality: SpecialityGQL.OTHER_HEALTH_AUXILIARY,
    professionalTitle: "Content Strategist",
    professionalAccreditation: [],
    profilePicUrl: "https://example.com/profiles/emily.jpg",
    coverPicUrl: "https://example.com/covers/emily-cover.jpg",
    bio: "Writing content that connects and converts.",
    location: { city: "London", country: "UK" },
    websiteUrl: "https://emilyclarkwrites.com",
    accountStatus: AccountStatusGQL.ACTIVE,
    connections: [],
    followers: [],
    following: [],
    blockedUsers: [],
    createdAt: "2025-01-25T12:40:00Z",
    updatedAt: "2025-02-10T18:30:00Z",
    lastLoginAt: "2025-02-10T18:30:00Z"
  }
    ];

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

  return (
    <Sidebar className="bg-background" side="right" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex row items-center justify-between p-2">
                {!user || loading ? (
                    <Skeleton className="h-8 w-8 rounded-lg"/>
                ) : (
                    <Avatar className="h-8 w-8 rounded-full">
                        <AvatarImage className="object-cover" src={user.profilePicUrl} alt={user.userType === UserTypeGQL.INDIVIDUAL ? user.firstName : user.entityName } />
                        <AvatarFallback className="rounded-md">CN</AvatarFallback>
                    </Avatar>
                )}
                <div className="flex row items-center gap-2 justify-center">
                    {headerButtons.map((button, index) => (
                        <SidebarMenuButton className="border-muted rounded-full border-1" key={index} onClick={button.onClick}>
                            <button.icon />
                        </SidebarMenuButton>
                    ))}
                </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup className="py-0 px-4">
            <div className="flex row items-center justify-between py-2">
                <SidebarGroupLabel>Friends suggestions</SidebarGroupLabel>
                <SidebarGroupLabel className="text-primary cursor-pointer">See all <ArrowUpRight className="pl-1"/></SidebarGroupLabel>
            </div>
            <Separator />
            <SidebarGroupContent className="py-0">
                {friends.map((friend, index) => (
                    <div key={index}>
                        <SuggestionItem friend={friend} />
                        <Separator />
                    </div>
                ))}
            </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="py-0 px-4">
            <div className="flex row items-center justify-between py-2">
                <SidebarGroupLabel>Groups suggestions</SidebarGroupLabel>
                <SidebarGroupLabel className="text-primary cursor-pointer">See all <ArrowUpRight className="pl-1"/></SidebarGroupLabel>
            </div>
            <Separator />
            <SidebarGroupContent className="py-0">
                {friends.map((friend, index) => (
                    <div key={index}>
                        <SuggestionItem friend={friend} />
                        <Separator />
                    </div>
                ))}
            </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
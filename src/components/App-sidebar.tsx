"use client"

import * as React from "react"
import {
  BriefcaseBusiness,
  LibraryBig,
  MessageCircle,
  Newspaper,
  Settings,
  Store,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/Nav-main"
// import { NavProjects } from "@/components/nav-projects"
// import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/Nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { useDictionary } from "@/hooks/use-dictionary"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { useCleanPathname } from "./Header"
import { useMe } from "@/hooks/useData/index"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dict = useDictionary()
  // const {user} = useAppSelector((state) => state.user)
  const { me: user } = useMe();
  const router = useRouter()
  const pathname = useCleanPathname()
  const data = React.useMemo(() => ({
    navMain: [
      {
        title: dict.appSideBar.navMain.feed,
        url: "/",
        icon: Newspaper,
        isActive: pathname === "/",
        items: [
          // {
          //   title: "History",
          //   url: "#",
          // },
        ],
      },
      {
        title: dict.appSideBar.navMain.chat,
        url: "/chat",
        icon: MessageCircle,
        isActive: pathname === "/chat",
      },
      {
        title: dict.appSideBar.navMain.job,
        url: "/jobs",
        icon: BriefcaseBusiness,
        isActive: pathname === "/jobs",
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.friends,
        url: "/friends", // Note: "group" key is used for "friends" URL
        icon: Users,
        isActive: pathname === "/friends",
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.marketplace,
        url: "/marketplace",
        icon: Store,
        isActive: pathname === "/marketplace",
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.library,
        url: "/library",
        icon: LibraryBig,
        isActive: pathname === "/library",
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.settings,
        url: "/settings",
        icon: Settings,
        isActive: pathname === "/settings",
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.groups,
        url: "/groups",
        icon: Users,
        isActive: pathname.startsWith("/groups"),
        items: [
        ],
      },
    ],
  }), [dict, pathname])
  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border" side="left" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="cursor-pointer" onClick={() => router.push('/')}>
            <SidebarMenuButton size="lg" asChild>
              <a>
                <Image src="/logo.png" alt="PMSCONNECT Logo" width={32} height={32} className="h-8 w-auto" />
                {/* <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div> */}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">PMSCONNECT</span>
                  {/* <span className="truncate text-xs">Enterprise</span> */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {!user ? (
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ) : (
          <NavUser user={user} />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

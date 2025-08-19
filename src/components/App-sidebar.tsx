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
import { useAppSelector, useDictionary } from "@/lib/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dict = useDictionary()
  const {user} = useAppSelector((state) => state.user)
  const router = useRouter()
  const data = React.useMemo(() => ({
    navMain: [
      {
        title: dict.appSideBar.navMain.feed,
        url: "#",
        icon: Newspaper,
        isActive: true,
        items: [
          // {
          //   title: "History",
          //   url: "#",
          // },
        ],
      },
      {
        title: dict.appSideBar.navMain.chat,
        url: "#",
        icon: MessageCircle,
      },
      {
        title: dict.appSideBar.navMain.job,
        url: "#",
        icon: BriefcaseBusiness,
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.group,
        url: "#",
        icon: Users,
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.marketplace,
        url: "#",
        icon: Store,
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.library,
        url: "#",
        icon: LibraryBig,
        items: [
        ],
      },
      {
        title: dict.appSideBar.navMain.settings,
        url: "#",
        icon: Settings,
        items: [
        ],
      },
    ],
  }), [dict])
  return (
    <Sidebar className="bg-background" side="left" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a className="cursor-pointer" onClick={router.refresh}>
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

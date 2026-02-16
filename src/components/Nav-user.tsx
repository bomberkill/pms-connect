"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { User } from "@/types/User"
import { useAppDispatch } from "@/hooks/use-redux"
import { useDictionary } from "@/hooks/use-dictionary"
import { logoutUser } from "@/redux/services/userService"
import { useRouter } from "next/navigation"
import { getUserDisplayName } from "@/lib/user-utils"
import { useFcmToken } from "@/hooks/useData/index"
import { useUnreadNotificationCount } from "@/hooks/useData/useNotificationData"
import { useEffect } from "react"

export function NavUser(
  { user }: { user: User }) {
  const { isMobile } = useSidebar()
  const dispatch = useAppDispatch()
  const dict = useDictionary()
  const router = useRouter()

  console.log("NavUser rendering...")

  const { handleLogout: handleFcmLogout } = useFcmToken()
  const { unreadCount, subscribeToNewNotifications } = useUnreadNotificationCount()

  useEffect(() => {
    const unsubscribe = subscribeToNewNotifications()
    return () => unsubscribe()
  }, [subscribeToNewNotifications])

  const handleLogout = async () => {
    console.log("Logging out user:", user.email)
    await handleFcmLogout()
    await dispatch(logoutUser()).unwrap().catch((err) => {
      console.error("Logout failed:", err)
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage className="object-cover" src={user.profilePicUrl} alt={getUserDisplayName(user)} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-sidebar-accent" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden">
                <span className="truncate font-medium">{getUserDisplayName(user)}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[state=collapsed]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.profilePicUrl} alt={getUserDisplayName(user)} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{getUserDisplayName(user)}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.replace(`/profile/${user.slug}`)}>
                <BadgeCheck className="size-4 text-muted-foreground" />
                {dict.appSideBar.navUser.account}
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem> */}
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/notifications')}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Bell className="size-4 text-muted-foreground mr-2" />
                    {dict.appSideBar.navUser.notifications}
                  </div>
                  {unreadCount > 0 && (
                    <span className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout} >
              <LogOut className="size-4 text-muted-foreground" />
              {dict.appSideBar.navUser.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

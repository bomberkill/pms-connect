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
import { User, UserTypeGQL } from "@/types/User"
import { useAppDispatch, useDictionary } from "@/lib/hooks"
import { logoutUser } from "@/redux/services/userService"
import { useRouter } from "next/navigation"

export function NavUser(
  {user}: {user: User}) {
  const { isMobile } = useSidebar()
  const dispatch = useAppDispatch()
  const dict = useDictionary()
  const router = useRouter()

  const handleLogout = async () => {
    console.log("Logging out user:", user.email)
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
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage className="object-cover" src={user.profilePicUrl} alt={user.userType === UserTypeGQL.INDIVIDUAL ? user.firstName : user.entityName } />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden">
                <span className="truncate font-medium">{user.userType === UserTypeGQL.INDIVIDUAL ? `${user.firstName} ${user.lastName}` : user.entityName}</span>
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
                  <AvatarImage src={user.profilePicUrl} alt={user.userType === UserTypeGQL.INDIVIDUAL ? user.firstName : user.entityName } />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.userType === UserTypeGQL.INDIVIDUAL ? user.firstName : user.entityName }</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("profile")}>
                <BadgeCheck />
                {dict.appSideBar.navUser.account}
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem> */}
              <DropdownMenuItem className="cursor-pointer">
                <Bell />
                {dict.appSideBar.navUser.notifications}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout} >
              <LogOut />
              {dict.appSideBar.navUser.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

"use client"

import React, { useState } from "react";
import { useAppDispatch } from "@/hooks/use-redux";
import { useDictionary } from "@/hooks/use-dictionary";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Menu, Bell, Settings, LogOut, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTrigger, DrawerTitle } from "./ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { logoutUser } from "@/redux/services/userService";
import { getUserDisplayName } from "@/lib/user-utils";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import CreatePostComposer from "./CreatePostComposer";
import CreatePostComposerMobile from "./CreatePostComposerMobile";
import { useMe } from "@/hooks/useData/useUserData";
import { BottomNav } from "./BottomNav";
import { NotificationBadge } from "./NotificationBadge";
// import { locales } from "@/middleware";

export function useCleanPathname() {
  const pathname = usePathname();
  if (!pathname) return "/";
  const locales = ["en", "fr"]
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.replace(`/${locale}`, "");
    }
  }
  return pathname;
}

export default function Header() {
  const dict = useDictionary()
  const isMobile = useIsMobile();
  // console.log("pathname",pathname)
  // const { user } = useAppSelector((state) => state.user);
  const { me: user } = useMe();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const shouldShowFab = !pathname?.includes("/post/") && !pathname?.includes("/comment/") && !pathname?.includes("/messages");

  const handleLogout = async () => {
    if (!user) return;
    await dispatch(logoutUser()).unwrap().catch((err) => {
      console.error("Logout failed:", err)
    })
  }

  // Sur mobile, nous affichons une barre de navigation en bas
  if (isMobile) {
    const drawerNavItems = [
      { href: "/settings", icon: Settings, label: dict.appSideBar.navUser.settings, onClick: () => router.push('/settings') },
      { icon: LogOut, label: dict.appSideBar.navUser.logout, onClick: handleLogout },
    ];

    // ... inside the component, replacing the mobile return:

    return (
      <div>
        {/* <PWABanner /> Removed: Handled by global PwaInstallPrompt */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden border-b border-border">
          <div className="flex items-center justify-between h-14 px-4">
            <Link href="/">
              <Image src="/logo.png" alt="PMSCONNECT Logo" width={32} height={32} className="h-8 w-auto" />
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/search" className="text-muted-foreground hover:text-primary">
                <Search className="size-6" />
              </Link>
              <Link href="/notifications" className="text-muted-foreground hover:text-primary relative">
                <Bell className="size-6" />
                <NotificationBadge className="absolute -top-1.5 -right-1.5" />
              </Link>
              <Drawer>
                <DrawerTrigger asChild>
                  <button className="text-muted-foreground hover:text-primary">
                    <Menu className="size-6" />
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerTitle className="sr-only">{dict.common.menu}</DrawerTitle>
                  <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                      {user && (
                        <DrawerClose asChild>
                          <Link href={`/profile/${user.slug}`} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profilePicUrl} alt={getUserDisplayName(user)} />
                              <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-bold">{getUserDisplayName(user)}</span>
                              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </Link>
                        </DrawerClose>
                      )}
                    </DrawerHeader>
                    <Separator />
                    <div className="p-4 pb-0">
                      <nav>
                        <ul>
                          {drawerNavItems.map((drawerItem) => (
                            <li key={drawerItem.label}>
                              <DrawerClose asChild>
                                <Link
                                  href={drawerItem.href || '#'}
                                  onClick={drawerItem.onClick}
                                  className="flex items-center gap-4 rounded-md p-3 hover:bg-accent"
                                >
                                  <drawerItem.icon className="size-5 text-muted-foreground" />
                                  <span className="font-medium">{drawerItem.label}</span>
                                </Link>
                              </DrawerClose>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </header>

        <BottomNav />

        {/* Floating Action Button pour ajouter un post */}
        {shouldShowFab && (
          <div className="fixed bottom-20 right-4 z-40 md:hidden">
            <Drawer open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
              <DrawerTrigger asChild>
                <Button className="rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform duration-200 active:scale-95">
                  <Plus className="h-6 w-6" />
                  <span className="sr-only">{dict.header.addNewPost}</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerTitle className="sr-only">{dict.header.addNewPost}</DrawerTitle>
                <CreatePostComposerMobile className="w-full max-h-[80vh] overflow-y-auto" onCreated={() => setIsCreatePostOpen(false)} />
              </DrawerContent>
            </Drawer>
          </div>
        )}
        {/* <>
        </> */}
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 hidden items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 px-6 md:flex">
      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Input
          type="text"
          placeholder={dict.header.searchPlaceholder}
          className="rounded-md pr-10"
        />
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground size-[18px]"
        />
      </div>

      {/* Add New Post Button */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogTitle></DialogTitle>
        <DialogTrigger asChild>
          <Button className="cursor-pointer">{dict.header.addNewPost}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px] p-0">
          <CreatePostComposer onCreated={() => setIsCreatePostOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  )
}

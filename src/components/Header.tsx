"use client"

import React, { useState } from "react";
import { useAppDispatch, useAppSelector, useDictionary } from "@/lib/hooks";
// import { useAppDispatch, useAppSelector, useDictionary, useLang } from "@/lib/hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BriefcaseBusiness, LibraryBig, Search, Store, Menu, Bell, Settings, LogOut, Home, MessagesSquare, UsersRound, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTrigger } from "./ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { logoutUser } from "@/redux/services/userService";
import { getUserDisplayName } from "@/lib/user-utils";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import CreatePostComposer from "./CreatePostComposer";
import CreatePostComposerMobile from "./CreatePostComposerMobile";
import PWABanner from "./PWABanner";
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
  const pathname = useCleanPathname();
  // console.log("pathname",pathname)
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const handleLogout = async () => {
    if (!user) return;
    await dispatch(logoutUser()).unwrap().catch((err) => {
      console.error("Logout failed:", err)
    })
  }

  // Sur mobile, nous affichons une barre de navigation en bas
  if (isMobile) {
    const navItems = [
      { href: "/", icon: Home, label: dict.appSideBar.navMain.feed },
      { href: "/friends", icon: UsersRound, label: dict.appSideBar.navMain.friends },
      { href: "/chat", icon: MessagesSquare, label: dict.appSideBar.navMain.chat },
      { href: "/jobs", icon: BriefcaseBusiness, label: dict.appSideBar.navMain.job },
      { href: "/library", icon: LibraryBig, label: dict.appSideBar.navMain.library },
      { href: "/marketplace", icon: Store, label: dict.appSideBar.navMain.marketplace },
    ];
    
    const drawerNavItems = [
      { href: "/settings", icon: Settings, label: dict.appSideBar.navUser.settings, onClick: () => router.push('/settings') },
      { icon: LogOut, label: dict.appSideBar.navUser.logout, onClick: handleLogout },
    ];

    return (
      <div>
        <PWABanner />
        <header className="fixed top-0 left-0 right-0 z-50 bg-background md:hidden border-b border-border">
          <nav className="flex items-end justify-between mb-2">
          <div className="flex flex-col w-full">
            {/* Première ligne */}
            <div className="flex items-center justify-between h-14 px-4">
              <Link href="/">
                <Image src="/logo.png" alt="PMSCONNECT Logo" width={32} height={32} className="h-8 w-auto" />
                <span className="sr-only">{dict.appSideBar.navMain.feed}</span>
              </Link>

              <div className="flex items-center gap-4">
                <Link href="/search" className="text-muted-foreground hover:text-primary">
                  <div className="rounded-full bg-sidebar-accent w-7 h-7 flex items-center justify-center shadow-2xl">
                    <Search className="h-5 w-5" /><span className="sr-only">{dict.header.search}</span>
                  </div>
                </Link>
                <Link href="/notifications" className="text-muted-foreground hover:text-primary">
                  <div className="rounded-full bg-sidebar-accent w-7 h-7 flex items-center justify-center shadow-2xl">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                  </div>
                </Link>
                <Drawer>
                  <DrawerTrigger asChild>
                    <button className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
                      <div className="rounded-full bg-sidebar-accent w-7 h-7 flex items-center justify-center shadow-2xl">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">{dict.appSideBar.navMain.more}</span>
                      </div>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                      <DrawerHeader>
                        {user && (
                          <div className="flex items-center gap-3 p-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profilePicUrl} alt={getUserDisplayName(user)} />
                              <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-bold">{getUserDisplayName(user)}</span>
                              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
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
                      {/* <DrawerFooter>
                        <DrawerClose asChild>
                          <Button variant="outline">{dict.button.cancel}</Button>
                        </DrawerClose>
                      </DrawerFooter> */}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>

            {/* Seconde ligne */}
            <div className="flex items-center justify-around pt-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={cn(
                      "flex flex-col items-center mx-2 justify-center text-muted-foreground hover:text-primary w-16",
                      isActive && "text-primary border-b-2 border-primary"
                    )}
                  >
                    <item.icon className="h-5 w-5 mb-2" />
                    {/* <span className="text-xs mt-1">{item.label}</span> */}
                  </Link>
                );
              })}
            </div>
          </div>
          </nav>
        </header>
        {/* Floating Action Button pour ajouter un post */}
        <div className="fixed bottom-20 right-5 z-40 md:hidden">
          <Drawer open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DialogTitle></DialogTitle>
            <DrawerTrigger asChild>
              <Button className="rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform duration-200 active:scale-95">
                <Plus className="h-6 w-6" />
                <span className="sr-only">{dict.header.addNewPost}</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <CreatePostComposerMobile className="w-full max-h-[80vh] overflow-y-auto" onCreated={() => setIsCreatePostOpen(false)} />
            </DrawerContent>
          </Drawer>
        </div>
        {/* <>
        </> */}
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 hidden items-center justify-between gap-2 border-b bg-background py-3 px-6 md:flex">
      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Input
          type="text"
          placeholder={dict.header.searchPlaceholder}
          className="rounded-md pr-10"
        />
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
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

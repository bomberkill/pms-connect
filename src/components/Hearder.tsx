"use client"

import { useAppDispatch, useAppSelector, useDictionary } from "@/lib/hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BriefcaseBusiness, LibraryBig, MessageCircle, Search, Store, User, Menu, Bell, Settings, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTrigger } from "./ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { UserTypeGQL } from "@/types/User";
import { Separator } from "./ui/separator";
import { logoutUser } from "@/redux/services/userService";

export default function Header() {
  const dict = useDictionary()
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    if (!user) return;
    await dispatch(logoutUser()).unwrap().catch((err) => {
      console.error("Logout failed:", err)
    })
  }

  // Sur mobile, nous affichons une barre de navigation en bas
  if (isMobile) {
    const centerNavItems = [
      { href: "/chat", icon: MessageCircle, label: dict.appSideBar.navMain.chat },
      { href: "/jobs", icon: BriefcaseBusiness, label: dict.appSideBar.navMain.job },
      { href: "/profile", icon: User, label: dict.appSideBar.navMain.profile },
    ];
    
    const drawerNavItems = [
      { href: "/marketplace", icon: Store, label: dict.appSideBar.navMain.marketplace, onClick: () => router.push('/marketplace') },
      { href: "/library", icon: LibraryBig, label: dict.appSideBar.navMain.library, onClick: () => router.push('/library') },
      { href: "/notifications", icon: Bell, label: dict.appSideBar.navUser.notifications, onClick: () => router.push('/notifications') },
      { href: "/settings", icon: Settings, label: dict.appSideBar.navUser.settings, onClick: () => router.push('/settings') },
      { icon: LogOut, label: dict.appSideBar.navUser.logout, onClick: handleLogout },
    ];

    return (
      <header className="sticky top-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <nav className="flex items-end justify-between h-12 mb-2 px-4">
          {/* Block 1: Logo */}
          <div className="flex justify-start">
            <Link href="/">
              <Image src="/logo.png" alt="PMSCONNECT Logo" width={32} height={32} className="h-8 w-auto" />
              <span className="sr-only">{dict.appSideBar.navMain.feed}</span>
            </Link>
          </div>

          {/* Block 2: Center Navigation */}
          <div className="flex items-center justify-center gap-8">
            {centerNavItems.map((item) => {
              const isActive = (item.href === "/" && pathname === item.href) || (item.href !== "/" && pathname.includes(item.href));
              console.log("isActive", isActive, item.href, pathname);
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center text-muted-foreground hover:text-primary",
                    isActive && "text-primary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Block 3: More Menu */}
          <div className="flex justify-end">
            <Drawer>
              <DrawerTrigger asChild>
                <button className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{dict.appSideBar.navMain.more}</span>
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader>
                    {user && (
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profilePicUrl} alt={user.userType === UserTypeGQL.INDIVIDUAL ? user.firstName : user.entityName} />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-bold">{user.userType === UserTypeGQL.INDIVIDUAL ? `${user.firstName} ${user.lastName}` : user.entityName}</span>
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
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">{dict.button.cancel}</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 hidden items-center justify-between gap-2 border-b bg-background py-3 px-6 md:flex">
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
      <Button className="cursor-pointer">{dict.header.addNewPost}</Button>
    </header>
  )
}

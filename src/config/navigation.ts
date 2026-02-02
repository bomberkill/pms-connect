import {
    Home,
    LibraryBig,
    Users,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getNavItems = (dict: any, pathname: string) => [
    {
        title: dict.appSideBar.navMain.feed,
        url: "/",
        icon: Home,
        isActive: pathname === "/",
    },
    {
        title: dict.appSideBar.navMain.friends,
        url: "/friends",
        icon: Users,
        isActive: pathname === "/friends",
    },
    // {
    //     title: dict.appSideBar.navMain.chat,
    //     url: "/chat",
    //     icon: MessageCircle,
    //     isActive: pathname === "/chat",
    // },
    // {
    //     title: dict.appSideBar.navMain.job,
    //     url: "/jobs",
    //     icon: BriefcaseBusiness,
    //     isActive: pathname === "/jobs",
    // },
    // {
    //     title: dict.appSideBar.navMain.marketplace,
    //     url: "/marketplace",
    //     icon: Store,
    //     isActive: pathname === "/marketplace",
    // },
    {
        title: dict.appSideBar.navMain.library,
        url: "/library",
        icon: LibraryBig,
        isActive: pathname === "/library",
    },
];

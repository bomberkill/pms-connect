"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMyNotifications, useNotificationActions, useNotificationSubscription } from "@/hooks/useData/useNotificationData";
import { Notification, NotificationType } from "@/types/Notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { formatDistanceToNow, isToday, isThisWeek } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, Bell, CheckCheck, Heart, MessageCircle, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UserTypeGQL } from "@/types/User";
import { apolloClient } from "@/graphql/apolloClient";
import { buildGetCommentByIdQuery } from "@/graphql/queries/comment";
import { Comment } from "@/types/Comment";

const ICON_BY_TYPE: Record<NotificationType, { icon: React.ElementType; className: string }> = {
    [NotificationType.POST_LIKE]: { icon: Heart, className: "bg-primary text-primary-foreground" },
    [NotificationType.COMMENT_LIKE]: { icon: Heart, className: "bg-primary text-primary-foreground" },
    [NotificationType.POST_COMMENT]: { icon: MessageCircle, className: "bg-primary text-primary-foreground" },
    [NotificationType.NEW_FOLLOWER]: { icon: UserPlus, className: "bg-secondary-600 text-white" },
    [NotificationType.CONNECTION_REQUEST]: { icon: UserPlus, className: "bg-secondary-600 text-white" },
    [NotificationType.CONNECTION_ACCEPTED]: { icon: UserPlus, className: "bg-secondary-600 text-white" },
    [NotificationType.GROUP_INVITATION]: { icon: Users, className: "bg-tertiary-600 text-white" },
    [NotificationType.GROUP_JOIN_REQUEST]: { icon: Users, className: "bg-tertiary-600 text-white" },
    [NotificationType.GROUP_JOIN_REQUEST_ACCEPTED]: { icon: Users, className: "bg-tertiary-600 text-white" },
};

// Where a notification's own entityId actually points, per notification type
// — verified against the API's own notification-creation call sites (not
// guessed): POST_LIKE/POST_COMMENT carry a post id, COMMENT_LIKE a comment
// id (resolved separately in handleNotificationClick, since routing it
// requires an async lookup of its parent post), group types a group id (no
// slug lookup wired client-side yet, so those land on the groups list
// rather than a specific group), and CONNECTION_REQUEST carries no
// entityId at all (the API never passes one when creating it) so it can
// only route to the requests list.
function resolveNotificationHref(notification: Notification): string {
    switch (notification.type) {
        case NotificationType.POST_LIKE:
        case NotificationType.POST_COMMENT:
            return `/post/${notification.entityId}`;
        case NotificationType.NEW_FOLLOWER:
        case NotificationType.CONNECTION_ACCEPTED:
            return `/profile/${notification.sender.slug}`;
        case NotificationType.CONNECTION_REQUEST:
            return `/friends`;
        case NotificationType.GROUP_INVITATION:
        case NotificationType.GROUP_JOIN_REQUEST:
        case NotificationType.GROUP_JOIN_REQUEST_ACCEPTED:
            return `/groups`;
        default:
            return `/notifications`;
    }
}

export default function NotificationsView() {
    const dict = useDictionary();
    const router = useRouter();
    const dateLocale = typeof window !== "undefined" && window.location.pathname.startsWith("/fr") ? fr : enUS;
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const { loading, error } = useMyNotifications({
        skip: 0,
        limit: 20,
        onCompleted: (data: { getMyNotifications: Notification[] }) => {
            setNotifications(data.getMyNotifications);
        }
    });

    const { markAsRead } = useNotificationActions();

    const { notification: newNotification } = useNotificationSubscription();

    useEffect(() => {
        if (newNotification) {
            setNotifications((prev) => [newNotification, ...prev]);
        }
    }, [newNotification]);

    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        await markAsRead({ variables: { notificationIds: unreadIds } });

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead({ variables: { notificationIds: [notification.id] } });
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        }

        if (notification.type === NotificationType.COMMENT_LIKE && notification.entityId) {
            try {
                const { data } = await apolloClient.query<{ getCommentById: Comment }>({
                    query: buildGetCommentByIdQuery(),
                    variables: { id: notification.entityId },
                });
                const postId = data?.getCommentById?.post?.id;
                if (postId) {
                    router.push(`/post/${postId}?highlightComment=${notification.entityId}`);
                    return;
                }
            } catch (e) {
                console.error("Failed to resolve comment notification target", e);
            }
            router.push("/notifications");
            return;
        }

        router.push(resolveNotificationHref(notification));
    };

    const groups = useMemo(() => {
        const today: Notification[] = [];
        const thisWeek: Notification[] = [];
        const earlier: Notification[] = [];
        for (const n of notifications) {
            const date = new Date(n.createdAt);
            if (isToday(date)) today.push(n);
            else if (isThisWeek(date)) thisWeek.push(n);
            else earlier.push(n);
        }
        return [
            { label: dict.notifications.today, items: today },
            { label: dict.notifications.thisWeek, items: thisWeek },
            { label: dict.notifications.earlier, items: earlier },
        ].filter((group) => group.items.length > 0);
    }, [notifications, dict.notifications.today, dict.notifications.thisWeek, dict.notifications.earlier]);

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-center text-destructive">{dict.notifications.error}</div>;
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
                <h1 className="text-xl font-bold font-manrope">{dict.notifications.title}</h1>
                {notifications.some(n => !n.read) && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-primary hover:text-primary/80">
                        <CheckCheck className="w-4 h-4 mr-1" />
                        {dict.notifications.markAllRead}
                    </Button>
                )}
            </div>

            <div className="px-2 md:px-0">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Bell className="w-12 h-12 mb-4 opacity-20" />
                        <p>{dict.notifications.noNotifications}</p>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.label} className="mt-4 first:mt-2">
                            <h2 className="px-2 mb-1 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                                {group.label}
                            </h2>
                            <AnimatePresence initial={false}>
                                {group.items.map((notification) => {
                                    const { icon: Icon, className: iconClassName } = ICON_BY_TYPE[notification.type] ?? { icon: Bell, className: "bg-muted text-muted-foreground" };
                                    return (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={cn(
                                                "relative flex items-center gap-4 p-4 my-3 rounded-xl transition-all cursor-pointer border",
                                                !notification.read
                                                    ? "bg-primary/5 border-primary/10 shadow-sm"
                                                    : "bg-card hover:bg-muted/50 border-transparent hover:border-border"
                                            )}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            {!notification.read && (
                                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                                            )}

                                            <div className="relative shrink-0">
                                                <Avatar
                                                    shape={notification.sender.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"}
                                                    className="w-12 h-12 border border-border"
                                                >
                                                    <AvatarImage src={notification.sender.profilePicUrl} className="object-cover" />
                                                    <AvatarFallback>{getUserInitials(notification.sender)}</AvatarFallback>
                                                </Avatar>
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border-2 border-background",
                                                    iconClassName
                                                )}>
                                                    <Icon className="size-2.5" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground leading-snug">
                                                    <span className="font-semibold hover:underline decoration-primary underline-offset-4" onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/profile/${notification.sender.slug}`);
                                                    }}>{getUserDisplayName(notification.sender)}</span>
                                                    {" "}
                                                    <span className="text-muted-foreground font-normal">
                                                        {notification.message.replace(getUserDisplayName(notification.sender), '').trim()}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                                    <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: dateLocale })}</span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

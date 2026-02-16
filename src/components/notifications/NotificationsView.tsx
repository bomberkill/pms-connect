"use client";

import React, { useEffect, useState } from "react";
// Removed direct apollo hook imports and builders
import { useMyNotifications, useNotificationActions, useNotificationSubscription } from "@/hooks/useData/useNotificationData";
import { Notification, NotificationType } from "@/types/Notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { formatDistanceToNow } from "date-fns";
// import { fr, enUS } from "date-fns/locale";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, Bell, CheckCheck, Heart, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsView() {
    const dict = useDictionary();
    const router = useRouter();
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

        if (notification.type === NotificationType.NEW_FOLLOWER && notification.sender.slug) {
            router.push(`/profile/${notification.sender.slug}`);
        } else if (notification.entityId) {
            // Assuming posts
            router.push(`/post/${notification.entityId}`);
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.POST_LIKE:
                return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
            case NotificationType.POST_COMMENT:
                return <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500" />;
            case NotificationType.NEW_FOLLOWER:
                return <UserPlus className="w-4 h-4 text-green-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">{dict.notifications.error}</div>;
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
                <AnimatePresence initial={false}>
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Bell className="w-12 h-12 mb-4 opacity-20" />
                            <p>{dict.notifications.noNotifications}</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
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
                                    <Avatar className="w-12 h-12 border border-border">
                                        <AvatarImage src={notification.sender.profilePicUrl} className="object-cover" />
                                        <AvatarFallback>{getUserInitials(notification.sender)}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "absolute -bottom-1 -right-1 p-1 rounded-full shadow-sm border border-background",
                                        !notification.read ? "bg-background" : "bg-muted"
                                    )}>
                                        {getIcon(notification.type)}
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
                                            {/* Remove sender name from message if it starts with it to avoid duplication if we display it separately, 
                                                    but since we bold the name if present, we might just display the formatted message.
                                                    However, the previous code replaced it. Let's keep it clean.
                                                */}
                                            {notification.message.replace(getUserDisplayName(notification.sender), '').trim()}
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                        <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

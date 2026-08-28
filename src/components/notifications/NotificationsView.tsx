"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMyNotifications, useNotificationActions, useNotificationSubscription } from "@/hooks/useData/useNotificationData";
import { Notification, NotificationType } from "@/types/Notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { formatDistanceToNow, isToday, isThisWeek } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, Bell, CheckCheck, Heart, MessageCircle, UserPlus, Users, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UserTypeGQL } from "@/types/User";
import { apolloClient } from "@/graphql/apolloClient";
import { buildGetCommentByIdQuery } from "@/graphql/queries/comment";
import { Comment } from "@/types/Comment";
import { buildGetOrCreateConversationWithUserMutation } from "@/graphql/queries/message";
import { Conversation } from "@/types/Message";
import { useConnectionActions, useConnectionRequests, useMe } from "@/hooks/useData";
import { ConnectionRequestStatus } from "@/types/ConnectionRequest";

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
    [NotificationType.POST_APPROVED]: { icon: CheckCircle2, className: "bg-secondary-600 text-white" },
    [NotificationType.POST_REJECTED]: { icon: XCircle, className: "bg-muted text-muted-foreground" },
    [NotificationType.MESSAGE]: { icon: MessageCircle, className: "bg-primary text-primary-foreground" },
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
        case NotificationType.POST_APPROVED:
        case NotificationType.POST_REJECTED:
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
    const params = useParams<{ lang?: string }>();
    const dateLocale = params?.lang === "fr" ? fr : enUS;
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { me } = useMe();
    const { requests } = useConnectionRequests(ConnectionRequestStatus.PENDING);
    const { acceptRequest, declineRequest, accepting, declining } = useConnectionActions();

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

        if (notification.type === NotificationType.MESSAGE && notification.entityId) {
            // entityId is the sender's user id (targetUserId, same shape as
            // NEW_FOLLOWER) — resolve/create the conversation with them,
            // idempotent if one already exists.
            try {
                const { data } = await apolloClient.mutate<{ getOrCreateConversationWithUser: Conversation }>({
                    mutation: buildGetOrCreateConversationWithUserMutation(),
                    variables: { userId: notification.entityId },
                });
                const conversationId = data?.getOrCreateConversationWithUser?.id;
                if (conversationId) {
                    router.push(`/chat/${conversationId}`);
                    return;
                }
            } catch (e) {
                console.error("Failed to resolve message notification target", e);
            }
            router.push("/chat");
            return;
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

    const handleConnectionRequestAction = async (
        event: React.MouseEvent<HTMLButtonElement>,
        notification: Notification,
        action: "accept" | "decline",
    ) => {
        event.stopPropagation();
        const request = requests.find((item) =>
            item.status === ConnectionRequestStatus.PENDING &&
            item.recipient.id === me?.id &&
            item.requester.id === notification.sender.id
        );
        if (!request) {
            router.push("/friends");
            return;
        }

        if (action === "accept") {
            await acceptRequest({ variables: { requestId: request.id } });
        } else {
            await declineRequest({ variables: { requestId: request.id } });
        }

        setNotifications((prev) => prev.map((item) => (
            item.id === notification.id ? { ...item, read: true } : item
        )));
        if (!notification.read) {
            await markAsRead({ variables: { notificationIds: [notification.id] } });
        }
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
        <div className="mx-auto max-w-2xl pb-24">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur-xl">
                <h1 className="text-[1.55rem] font-black tracking-[-0.04em]">{dict.notifications.title}</h1>
                {notifications.some(n => !n.read) && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8 rounded-full px-2 text-xs font-bold text-primary hover:text-primary/80">
                        <CheckCheck className="mr-1 h-4 w-4" />
                        {dict.notifications.markAllRead}
                    </Button>
                )}
            </div>

            <div className="px-4 md:px-0">
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
                                    const canHandleConnectionRequest = notification.type === NotificationType.CONNECTION_REQUEST;
                                    return (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={cn(
                                                "relative -mx-1 flex cursor-pointer items-start gap-3 rounded-[1.35rem] px-1 py-3 transition-all",
                                                !notification.read
                                                    ? "bg-primary/5"
                                                    : "hover:bg-muted/45"
                                            )}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            {!notification.read && (
                                                <div className="absolute right-3 top-4 h-2 w-2 rounded-full bg-primary" />
                                            )}

                                            <div className="relative shrink-0">
                                                <Avatar
                                                    shape={notification.sender.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"}
                                                    className="h-11 w-11 border border-border"
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
                                                {canHandleConnectionRequest && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="h-8 rounded-full px-4 text-xs"
                                                            disabled={accepting || declining}
                                                            onClick={(event) => handleConnectionRequestAction(event, notification, "accept")}
                                                        >
                                                            {accepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                                            {dict.actions.accept}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 rounded-full px-4 text-xs"
                                                            disabled={accepting || declining}
                                                            onClick={(event) => handleConnectionRequestAction(event, notification, "decline")}
                                                        >
                                                            {declining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                                            {dict.actions.ignore ?? dict.actions.declineRequest}
                                                        </Button>
                                                    </div>
                                                )}
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

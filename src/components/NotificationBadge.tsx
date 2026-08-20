"use client"

import React, { useEffect } from 'react'
import { useUnreadNotificationCount } from '@/hooks/useData/useNotificationData'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
    className?: string
    variant?: 'dot' | 'number'
}

export function NotificationBadge({ className, variant = 'number' }: NotificationBadgeProps) {
    const { unreadCount, subscribeToNewNotifications } = useUnreadNotificationCount()

    useEffect(() => {
        const unsubscribe = subscribeToNewNotifications()
        return () => unsubscribe()
    }, [subscribeToNewNotifications])

    if (unreadCount === 0) return null

    if (variant === 'dot') {
        return (
            <span className={cn("absolute block h-3 w-3 rounded-full bg-error ring-2 ring-background", className)} />
        )
    }

    return (
        <span className={cn(
            "flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-2xs font-bold text-error-foreground ring-2 ring-background",
            className
        )}>
            {unreadCount > 99 ? '99+' : unreadCount}
        </span>
    )
}

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
            <span className={cn("absolute block h-3 w-3 rounded-full bg-red-500 ring-2 ring-background", className)} />
        )
    }

    return (
        <span className={cn(
            "flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background",
            className
        )}>
            {unreadCount > 99 ? '99+' : unreadCount}
        </span>
    )
}

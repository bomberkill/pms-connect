import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
    buildGetMyNotificationsQuery,
    buildMarkNotificationsAsReadMutation,
    buildNotificationAddedSubscription,
} from '@/graphql/queries/index';
import { Notification } from '@/types/Notification';

// =============================================================================
// == NOTIFICATIONS
// =============================================================================

/**
 * Hook to fetch the current user's notifications.
 */
export const useMyNotifications = (options?: { skip?: number; limit?: number; onCompleted?: (data: { getMyNotifications: Notification[] }) => void }) => {
    const { data, loading, error, refetch, fetchMore } = useQuery<{ getMyNotifications: Notification[] }>(
        buildGetMyNotificationsQuery(),
        {
            variables: {
                skip: options?.skip || 0,
                limit: options?.limit || 20
            },
            fetchPolicy: 'cache-and-network',
            onCompleted: options?.onCompleted,
        }
    );

    return {
        notifications: data?.getMyNotifications || [],
        loading,
        error,
        refetch,
        fetchMore,
    };
};

/**
 * Hook for notification mutations.
 */
export const useNotificationActions = () => {
    const [markAsRead, { loading: marking, error: markError }] = useMutation<
        { markNotificationsAsRead: boolean },
        { notificationIds: string[] }
    >(buildMarkNotificationsAsReadMutation());

    return {
        markAsRead,
        marking,
        markError,
    };
};

/**
 * Hook to subscribe to new notifications.
 */
export const useNotificationSubscription = () => {
    const { data, loading, error } = useSubscription<{ notificationAdded: Notification }>(
        buildNotificationAddedSubscription()
    );

    return {
        notification: data?.notificationAdded,
        loading,
        error,
    };
};

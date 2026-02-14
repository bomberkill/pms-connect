import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
    buildGetMyNotificationsQuery,
    buildMarkNotificationsAsReadMutation,
    buildNotificationAddedSubscription,
    buildUnreadNotificationsCountQuery,
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
    >(buildMarkNotificationsAsReadMutation(), {
        optimisticResponse: {
            markNotificationsAsRead: true
        },
        update(cache, { data }, { variables }) {
            if (data?.markNotificationsAsRead && variables?.notificationIds) {
                variables.notificationIds.forEach(id => {
                    cache.modify({
                        id: cache.identify({ __typename: 'Notification', id }),
                        fields: {
                            read: () => true
                        }
                    });
                });

                // Update unread count in cache
                cache.modify({
                    fields: {
                        unreadNotificationsCount(existingCount = 0) {
                            return Math.max(0, existingCount - variables.notificationIds.length);
                        }
                    }
                });
            }
        }
    });

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

/**
 * Hook to fetch and track unread notifications count.
 */
export const useUnreadNotificationCount = () => {
    const { data, loading, error, subscribeToMore } = useQuery<{ unreadNotificationsCount: number }>(
        buildUnreadNotificationsCountQuery(),
        {
            fetchPolicy: 'cache-first',
        }
    );

    return {
        unreadCount: data?.unreadNotificationsCount || 0,
        loading,
        error,
        subscribeToNewNotifications: () => {
            return subscribeToMore({
                document: buildNotificationAddedSubscription(),
                updateQuery: (prev, { subscriptionData }) => {
                    if (!subscriptionData.data) return prev;
                    // Increment count
                    return {
                        ...prev,
                        unreadNotificationsCount: (prev.unreadNotificationsCount || 0) + 1
                    };
                }
            });
        }
    };
};

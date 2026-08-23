import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
    buildGetMyNotificationsQuery,
    buildMarkNotificationsAsReadMutation,
    buildNotificationAddedSubscription,
    buildUnreadNotificationsCountQuery,
    buildGetMyNotificationPreferencesQuery,
    buildUpdateNotificationPreferencesMutation,
} from '@/graphql/queries/index';
import { Notification, NotificationPreference, UpdateNotificationPreferencesInput } from '@/types/Notification';

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
 * Hook to fetch the current user's notification preferences.
 */
export const useNotificationPreferences = () => {
    const { data, loading, error, refetch } = useQuery<{ getMyNotificationPreferences: NotificationPreference }>(
        buildGetMyNotificationPreferencesQuery(),
        {
            fetchPolicy: 'cache-and-network',
        }
    );

    return {
        preferences: data?.getMyNotificationPreferences,
        loading,
        error,
        refresh: refetch,
    };
};

/**
 * Hook to update notification preferences. Callers typically pass one
 * field at a time (auto-save on toggle), same pattern as the existing
 * push-notification row in SettingsViewMobile.
 */
export const useUpdateNotificationPreferences = () => {
    const [updateNotificationPreferences, { loading: updating, error: updateError }] = useMutation<
        { updateNotificationPreferences: NotificationPreference },
        { input: UpdateNotificationPreferencesInput }
    >(buildUpdateNotificationPreferencesMutation(), {
        update(cache, { data }) {
            if (!data?.updateNotificationPreferences) return;
            cache.writeQuery({
                query: buildGetMyNotificationPreferencesQuery(),
                data: { getMyNotificationPreferences: data.updateNotificationPreferences },
            });
        },
    });

    return { updateNotificationPreferences, updating, updateError };
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

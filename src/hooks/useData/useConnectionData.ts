import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
    buildGetConnectionsQuery,
    buildGetMyConnectionRequestsQuery,
    buildGetMeQuery,
    buildSendConnectionRequestMutation,
    buildAcceptConnectionRequestMutation,
    buildDeclineOrCancelConnectionRequestMutation,
    buildRemoveConnectionMutation,
    buildConnectionRequestUpdatedSubscription,
} from '@/graphql/queries/index';
import { ConnectionRequest, ConnectionRequestForSubscription, ConnectionRequestStatus } from '@/types/ConnectionRequest';
import { User } from '@/types/User';

// =============================================================================
// == CONNECTIONS
// =============================================================================

/**
 * Hook to fetch the current user's connection requests.
 */
export const useConnectionRequests = (status?: ConnectionRequestStatus) => {
    const { data, loading, error, refetch } = useQuery<{ getMyConnectionRequests: ConnectionRequest[] }>(
        buildGetMyConnectionRequestsQuery(), {
        variables: { status },
        fetchPolicy: 'cache-and-network',
    }
    );

    return {
        requests: data?.getMyConnectionRequests || [],
        loading,
        error,
        refetch,
    };
}

/**
 * Hook that provides connection-related mutation actions with optimized cache updates.
 */
export const useConnectionActions = () => {
    const [sendRequest, { loading: sending, error: sendError }] = useMutation<
        { sendConnectionRequest: boolean },
        { recipientId: string }
    >(buildSendConnectionRequestMutation(), {
        optimisticResponse: {
            sendConnectionRequest: true,
        },
        update: (cache, { data }, { variables }) => {
            if (!data?.sendConnectionRequest || !variables) return;

            // Read current connection requests from cache
            const existingData = cache.readQuery<{ getMyConnectionRequests: ConnectionRequest[] }>({
                query: buildGetMyConnectionRequestsQuery(),
            });

            if (existingData) {
                // Create optimistic connection request
                const optimisticRequest: ConnectionRequest = {
                    id: `temp-${Date.now()}`,
                    requester: { id: 'current-user' } as User, // Will be updated by server response
                    recipient: { id: variables.recipientId } as User,
                    status: ConnectionRequestStatus.PENDING,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                // Write updated requests to cache
                cache.writeQuery({
                    query: buildGetMyConnectionRequestsQuery(),
                    data: {
                        getMyConnectionRequests: [...existingData.getMyConnectionRequests, optimisticRequest],
                    },
                });
            }
        },
    });

    const [acceptRequest, { loading: accepting, error: acceptError }] = useMutation<
        { acceptConnectionRequest: boolean },
        { requestId: string }
    >(buildAcceptConnectionRequestMutation(), {
        optimisticResponse: {
            acceptConnectionRequest: true,
        },
        update: (cache, { data }, { variables }) => {
            if (!data?.acceptConnectionRequest || !variables) return;

            // Remove the accepted request from connection requests
            const existingData = cache.readQuery<{ getMyConnectionRequests: ConnectionRequest[] }>({
                query: buildGetMyConnectionRequestsQuery(),
            });

            if (existingData) {
                cache.writeQuery({
                    query: buildGetMyConnectionRequestsQuery(),
                    data: {
                        getMyConnectionRequests: existingData.getMyConnectionRequests.filter(
                            req => req.id !== variables.requestId
                        ),
                    },
                });
            }

            // Update user's connections count in cache (me query)
            const meData = cache.readQuery<{ me: User }>({
                query: buildGetMeQuery(),
            });

            if (meData?.me) {
                cache.writeQuery({
                    query: buildGetMeQuery(),
                    data: {
                        me: {
                            ...meData.me,
                            // Connections array will be updated by server response
                        },
                    },
                });
            }
        },
    });

    const [declineRequest, { loading: declining, error: declineError }] = useMutation<
        { declineOrCancelConnectionRequest: boolean },
        { requestId: string }
    >(buildDeclineOrCancelConnectionRequestMutation(), {
        optimisticResponse: {
            declineOrCancelConnectionRequest: true,
        },
        update: (cache, { data }, { variables }) => {
            if (!data?.declineOrCancelConnectionRequest || !variables) return;

            // Remove the declined request from connection requests
            const existingData = cache.readQuery<{ getMyConnectionRequests: ConnectionRequest[] }>({
                query: buildGetMyConnectionRequestsQuery(),
            });

            if (existingData) {
                cache.writeQuery({
                    query: buildGetMyConnectionRequestsQuery(),
                    data: {
                        getMyConnectionRequests: existingData.getMyConnectionRequests.filter(
                            req => req.id !== variables.requestId
                        ),
                    },
                });
            }
        },
    });

    const [removeConnection, { loading: removing, error: removeError }] = useMutation<
        { removeConnection: boolean },
        { userIdB: string }
    >(buildRemoveConnectionMutation(), {
        optimisticResponse: {
            removeConnection: true,
        },
        update: (cache, { data }, { variables }) => {
            if (!data?.removeConnection || !variables) return;

            // Update user's connections in cache
            const meData = cache.readQuery<{ me: User }>({
                query: buildGetMeQuery(),
            });

            if (meData?.me) {
                cache.writeQuery({
                    query: buildGetMeQuery(),
                    data: {
                        me: {
                            ...meData.me,
                            connections: meData.me.connections?.filter(
                                conn => conn !== variables.userIdB && conn !== variables.userIdB
                            ) || [],
                        },
                    },
                });
            }
        },
    });

    return {
        sendRequest,
        sending,
        sendError,
        acceptRequest,
        accepting,
        acceptError,
        declineRequest,
        declining,
        declineError,
        removeConnection,
        removing,
        removeError,
    };
};

/**
 * Hook for subscribing to connection request updates.
 */
export const useConnectionRequestUpdatedSubscription = () => {
    const { data, loading, error } = useSubscription<{ connectionRequestUpdated: ConnectionRequestForSubscription }>(
        buildConnectionRequestUpdatedSubscription()
    );

    // console.log('useConnectionRequestUpdatedSubscription , data: ', data, ' data.connectionRequestUpdated: ', data?.connectionRequestUpdated)
    return { updatedRequest: data?.connectionRequestUpdated, loading, error };
};

/**
 * Hook to fetch user connections.
 */
export const useConnections = (userId: string) => {
    const { data, loading, error, refetch } = useQuery<{ getConnections: User[] }>(
        buildGetConnectionsQuery(),
        {
            variables: { userId },
            skip: !userId,
            fetchPolicy: 'cache-and-network',
        }
    );

    return {
        connections: data?.getConnections || [],
        loading,
        error,
        refetch,
    };
};

/**
 * Hook to fetch the current user's connections.
 * This is a convenience wrapper around useConnections that uses the current user's ID.
 */
export const useMyConnections = () => {
    const { data } = useQuery<{ me: User }>(
        buildGetMeQuery(),
        {
            fetchPolicy: 'cache-first',
        }
    );

    return useConnections(data?.me?.id || '');
};

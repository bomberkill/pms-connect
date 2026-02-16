import { useQuery, useMutation, useSubscription, gql, Reference } from '@apollo/client';
import {
    buildGetConnectionsQuery,
    buildGetMyConnectionRequestsQuery,
    buildGetMeQuery,
    buildSendConnectionRequestMutation,
    buildAcceptConnectionRequestMutation,
    buildDeclineOrCancelConnectionRequestMutation,
    buildRemoveConnectionMutation,
    buildConnectionRequestUpdatedSubscription,
    CONNECTION_REQUEST_FIELDS,
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

import { useMe } from './useUserData';

/**
 * Hook that provides connection-related mutation actions with optimized cache updates.
 */
export const useConnectionActions = () => {
    const { me } = useMe();
    const [sendRequest, { loading: sending, error: sendError }] = useMutation<
        { sendConnectionRequest: boolean },
        { recipientId: string }
    >(buildSendConnectionRequestMutation(), {
        optimisticResponse: {
            sendConnectionRequest: true,
        },
        update: (cache, { data }, { variables }) => {
            if (!data?.sendConnectionRequest || !variables) return;

            cache.modify({
                fields: {
                    getMyConnectionRequests(existingRequests = []) {
                        const newRequestRef = cache.writeFragment({
                            data: {
                                id: `temp-${Date.now()}`,
                                requester: { __typename: 'User', id: me?.id || 'current-user' }, // Placeholder updated with real ID
                                recipient: { __typename: 'User', id: variables.recipientId },
                                status: ConnectionRequestStatus.PENDING,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                __typename: 'ConnectionRequest'
                            },
                            fragment: gql`
                                fragment NewConnectionRequest on ConnectionRequest {
                                    ${CONNECTION_REQUEST_FIELDS}
                                }
                            `
                        });
                        return [...existingRequests, newRequestRef];
                    }
                }
            });
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

            cache.modify({
                fields: {
                    getMyConnectionRequests(existingRequests = [], { readField }) {
                        return existingRequests.filter(
                            (reqRef: Reference) => readField('id', reqRef) !== variables.requestId
                        );
                    }
                }
            });

            // Note: The 'me' query connections update is handled by cache invalidation or refetch usually, 
            // or we could optimistically add the connection if we knew the user ID.
            // keeping it simple as per previous logic which didn't actually update the array manually.
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

            cache.modify({
                fields: {
                    getMyConnectionRequests(existingRequests = [], { readField }) {
                        return existingRequests.filter(
                            (reqRef: Reference) => readField('id', reqRef) !== variables.requestId
                        );
                    }
                }
            });
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

            if (me) {
                cache.modify({
                    id: cache.identify({ __typename: 'User', id: me.id }),
                    fields: {
                        connections(existingConnections: readonly Reference[] = [], { readField }) {
                            return existingConnections.filter(conn => {
                                // Handle both string IDs and References
                                const id = typeof conn === 'string' ? conn : readField('id', conn);
                                return id !== variables.userIdB;
                            });
                        }
                    }
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

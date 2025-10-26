import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  buildGetMyConnectionRequestsQuery,
  buildSendConnectionRequestMutation,
  buildAcceptConnectionRequestMutation,
  buildDeclineOrCancelConnectionRequestMutation,
  buildRemoveConnectionMutation,
  buildConnectionRequestUpdatedSubscription,
} from '@/graphql/queries/index';
import { ConnectionRequest, ConnectionRequestForSubscription, ConnectionRequestStatus } from '@/types/ConnectionRequest';

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
 * Hook that provides connection-related mutation actions.
 */
export const useConnectionActions = () => {
  const [sendRequest, { loading: sending, error: sendError }] = useMutation<{ sendConnectionRequest: boolean }, { recipientId: string }>(buildSendConnectionRequestMutation(), {
    // variables: { recipientId: userId },
    refetchQueries: ["GetMyConnectionRequests"]
  });

  const [acceptRequest, { loading: accepting, error: acceptError }] = useMutation<{ acceptConnectionRequest: boolean }, { requestId: string }>(buildAcceptConnectionRequestMutation(), {
    // variables: { requestId },
    refetchQueries: ['GetMyConnectionRequests', 'GetMe']
  });

  const [declineRequest, { loading: declining, error: declineError }] = useMutation<{ declineOrCancelConnectionRequest: boolean }, { requestId: string }>(buildDeclineOrCancelConnectionRequestMutation(), {
    // variables: { requestId },
    refetchQueries: ['GetMyConnectionRequests']
  });

  const [removeConnection, { loading: removing, error: removeError }] = useMutation<{ removeConnection: boolean }, { userIdB: string }>(buildRemoveConnectionMutation(), {
    // variables: { userIdB: userId },
    refetchQueries: ['GetMyConnectionRequests', 'GetMe']
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

"use client";

import React, { useEffect } from "react";
import { useConnectionRequests, useConnectionRequestUpdatedSubscription, useUsers, useMe, useMyConnections } from "@/hooks/useData/index";
import { ConnectionRequestStatus } from "@/types/ConnectionRequest";
import FriendsTabs from "@/components/friends/FriendsTabs";

export default function FriendsPage() {
  const { me: user } = useMe();

  const { suggestions: suggestedFriends, loading: loadingSuggestions } = useUsers({ limit: 12 });

  // Fetch ALL pending requests (both incoming and outgoing logic handled in Tabs)
  const { requests: connectionRequests, loading: loadingRequests, refetch: refetchRequests } =
    useConnectionRequests(ConnectionRequestStatus.PENDING);

  // Fetch active connections
  const { connections, loading: loadingConnections } = useMyConnections();

  const { updatedRequest } = useConnectionRequestUpdatedSubscription();

  useEffect(() => {
    if (updatedRequest) {
      refetchRequests();
    }
  }, [updatedRequest, refetchRequests]);

  const loading = loadingRequests || loadingSuggestions || loadingConnections;

  return (
    <FriendsTabs
      requests={connectionRequests}
      suggestions={suggestedFriends}
      connections={connections}
      me={user ?? undefined}
      loading={loading}
    />
  );
}

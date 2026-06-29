import { useQuery, useMutation } from '@apollo/client';
import {
    buildGetGroupsQuery,
    buildGetGroupBySlugQuery,
    buildGetGroupByIdQuery,
    buildCreateGroupMutation,
    buildUpdateGroupMutation,
    buildDeleteGroupMutation,
    buildLeaveGroupMutation,
    buildJoinGroupMutation,
    buildGetMyGroupMembershipQuery,
    buildGetMyGroupJoinRequestsQuery,
    buildAcceptGroupInvitationMutation,
    buildDeclineGroupInvitationMutation,
    buildCancelGroupJoinRequestMutation,
    buildGetGroupJoinRequestsQuery,
    buildApproveGroupJoinRequestMutation,
    buildRejectGroupJoinRequestMutation,
    buildRemoveGroupMemberMutation,
    buildUpdateGroupMemberRoleMutation,
} from '@/graphql/queries/index';
import {
    Group,
    CreateGroupInput,
    GroupPrivacy,
    GroupJoinRequest,
    GroupJoinRequestStatus,
    GroupMembership,
} from '@/types/Group';

/**
 * Hook for fetching a list of groups with pagination and filtering.
 */
export const useGroups = (options: { skip?: number, limit?: number, search?: string, privacy?: GroupPrivacy } = {}) => {
    const { skip = 0, limit = 10, search, privacy } = options;

    const { data, loading, error, fetchMore, refetch } = useQuery<{ getGroups: Group[] }>(
        buildGetGroupsQuery(),
        {
            variables: { skip, limit, search, privacy },
            fetchPolicy: "cache-and-network",
            nextFetchPolicy: "cache-first",
        }
    );

    const groups: Group[] = data?.getGroups || [];

    const loadMore = async () => {
        await fetchMore({
            variables: {
                skip: groups.length,
                limit,
            },
        });
    };

    return {
        groups,
        loading,
        error,
        loadMore,
        refresh: refetch,
    };
};

/**
 * Hook for fetching a single group by its slug.
 */
export const useGroup = (slug: string) => {
    const { data, loading, error, refetch } = useQuery<{ getGroupBySlug: Group }>(
        buildGetGroupBySlugQuery(),
        {
            variables: { slug },
            skip: !slug,
            fetchPolicy: "cache-and-network",
        }
    );

    return {
        group: data?.getGroupBySlug,
        loading,
        error,
        refresh: refetch,
    };
};

/**
 * Hook for fetching a single group by its ID.
 */
export const useGroupById = (id: string) => {
    const { data, loading, error, refetch } = useQuery<{ getGroupById: Group }>(
        buildGetGroupByIdQuery(),
        {
            variables: { id },
            skip: !id,
            fetchPolicy: "cache-and-network",
        }
    );

    return {
        group: data?.getGroupById,
        loading,
        error,
        refresh: refetch,
    };
};

/**
 * Hook for managing Group mutations (create, leave, etc).
 */
export const useGroupMutations = () => {
    const [createGroup, { loading: creating, error: createError }] = useMutation<
        { createGroup: Group }, { createGroupInput: CreateGroupInput }
    >(buildCreateGroupMutation());

    const [updateGroup, { loading: updating, error: updateError }] = useMutation<
        { updateGroup: Group }, { groupId: string; updateGroupInput: Partial<CreateGroupInput> }
    >(buildUpdateGroupMutation());

    const [deleteGroup, { loading: deleting, error: deleteError }] = useMutation<
        { deleteGroup: boolean }, { groupId: string }
    >(buildDeleteGroupMutation());

    const [leaveGroup, { loading: leaving, error: leaveError }] = useMutation<
        { leaveGroup: Group }, { groupId: string }
    >(buildLeaveGroupMutation());

    const [requestToJoinGroup, { loading: joining, error: joinError }] = useMutation<
        { requestToJoinGroup: boolean }, { groupId: string }
    >(buildJoinGroupMutation());

    const [acceptGroupInvitation, { loading: acceptingInvitation, error: acceptInvitationError }] = useMutation<
        { acceptGroupInvitation: boolean }, { input: { requestId: string } }
    >(buildAcceptGroupInvitationMutation());

    const [declineGroupInvitation, { loading: decliningInvitation, error: declineInvitationError }] = useMutation<
        { declineGroupInvitation: boolean }, { input: { requestId: string } }
    >(buildDeclineGroupInvitationMutation());

    const [cancelGroupJoinRequest, { loading: cancellingJoinRequest, error: cancelJoinRequestError }] = useMutation<
        { cancelGroupJoinRequest: boolean }, { input: { requestId: string } }
    >(buildCancelGroupJoinRequestMutation());

    const [approveGroupJoinRequest, { loading: approvingJoinRequest, error: approveJoinRequestError }] = useMutation<
        { approveGroupJoinRequest: boolean }, { input: { requestId: string } }
    >(buildApproveGroupJoinRequestMutation());

    const [rejectGroupJoinRequest, { loading: rejectingJoinRequest, error: rejectJoinRequestError }] = useMutation<
        { rejectGroupJoinRequest: boolean }, { input: { requestId: string } }
    >(buildRejectGroupJoinRequestMutation());

    const [removeGroupMember, { loading: removingMember, error: removeMemberError }] = useMutation<
        { removeGroupMember: Group }, { groupId: string; userId: string }
    >(buildRemoveGroupMemberMutation());

    const [updateGroupMemberRole, { loading: updatingMemberRole, error: updateMemberRoleError }] = useMutation<
        { updateGroupMemberRole: GroupMembership },
        { groupId: string; updateGroupMemberRoleInput: { userId: string; role: string } }
    >(buildUpdateGroupMemberRoleMutation());

    return {
        createGroup,
        creating,
        createError,
        updateGroup,
        updating,
        updateError,
        deleteGroup,
        deleting,
        deleteError,
        leaveGroup,
        leaving,
        leaveError,
        requestToJoinGroup,
        joining,
        joinError,
        acceptGroupInvitation,
        acceptingInvitation,
        acceptInvitationError,
        declineGroupInvitation,
        decliningInvitation,
        declineInvitationError,
        cancelGroupJoinRequest,
        cancellingJoinRequest,
        cancelJoinRequestError,
        approveGroupJoinRequest,
        approvingJoinRequest,
        approveJoinRequestError,
        rejectGroupJoinRequest,
        rejectingJoinRequest,
        rejectJoinRequestError,
        removeGroupMember,
        removingMember,
        removeMemberError,
        updateGroupMemberRole,
        updatingMemberRole,
        updateMemberRoleError,
    };
};

export const useMyGroupMembership = (groupId?: string) => {
    const { data, loading, error, refetch } = useQuery<{ getMyGroupMembership: GroupMembership | null }>(
        buildGetMyGroupMembershipQuery(),
        {
            variables: { groupId },
            skip: !groupId,
            fetchPolicy: "cache-and-network",
        }
    );

    return {
        membership: data?.getMyGroupMembership ?? null,
        loading,
        error,
        refresh: refetch,
    };
};

export const useMyGroupJoinRequests = (
    options: { groupId?: string; status?: GroupJoinRequestStatus; skip?: number; limit?: number } = {}
) => {
    const { groupId, status, skip = 0, limit = 10 } = options;

    const { data, loading, error, refetch } = useQuery<{ getMyGroupJoinRequests: GroupJoinRequest[] }>(
        buildGetMyGroupJoinRequestsQuery(),
        {
            variables: { groupId, status, skip, limit },
            fetchPolicy: "cache-and-network",
        }
    );

    return {
        requests: data?.getMyGroupJoinRequests ?? [],
        loading,
        error,
        refresh: refetch,
    };
};

export const useGroupJoinRequests = (
    options: { groupId?: string; status?: GroupJoinRequestStatus } = {}
) => {
    const { groupId, status } = options;

    const { data, loading, error, refetch } = useQuery<{ getGroupJoinRequests: GroupJoinRequest[] }>(
        buildGetGroupJoinRequestsQuery(),
        {
            variables: { groupId, status },
            skip: !groupId,
            fetchPolicy: "cache-and-network",
        }
    );

    return {
        requests: data?.getGroupJoinRequests ?? [],
        loading,
        error,
        refresh: refetch,
    };
};

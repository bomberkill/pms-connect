import { useQuery, useMutation } from '@apollo/client';
import {
    buildGetGroupsQuery,
    buildGetGroupBySlugQuery,
    buildGetGroupByIdQuery,
    buildCreateGroupMutation,
    buildUpdateGroupMutation,
    buildLeaveGroupMutation
} from '@/graphql/queries/index';
import { Group, CreateGroupInput, GroupPrivacy } from '@/types/Group';

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

    const [leaveGroup, { loading: leaving, error: leaveError }] = useMutation<
        { leaveOrRemoveMemberFromGroup: Group }, { groupId: string }
    >(buildLeaveGroupMutation());

    return {
        createGroup,
        creating,
        createError,
        updateGroup,
        updating,
        updateError,
        leaveGroup,
        leaving,
        leaveError
    };
};

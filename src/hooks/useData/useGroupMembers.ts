import { useQuery } from '@apollo/client';
import { buildGetGroupMembersQuery } from '@/graphql/queries/groups';
import { GroupMembership } from '@/types/Group';

/**
 * Hook to fetch group members using the new GroupMembership collection
 */
export const useGroupMembers = (groupId: string, limit = 50) => {
    const { data, loading, error, fetchMore, refetch } = useQuery(
        buildGetGroupMembersQuery(),
        {
            variables: { groupId, skip: 0, limit },
            skip: !groupId,
            fetchPolicy: 'cache-and-network', // ✅ Added
        }
    );

    const members: GroupMembership[] = data?.getGroupMembers || [];

    return {
        members,
        membersCount: members.length,
        loading,
        error,
        refresh: refetch,
        loadMore: () => fetchMore({
            variables: { skip: members.length },
            // ✅ Removed updateQuery - typePolicy handles merge
        }),
    };
};

/**
 * Hook to check if current user is a member of a group
 */
export const useIsGroupMember = (groupId: string, userId: string) => {
    const { members, loading } = useGroupMembers(groupId, 100); // Fetch enough to check membership

    const isMember = members.some(
        (m: GroupMembership) => m.user.id === userId || (m.user as unknown as { _id: string })._id === userId
    );

    return { isMember, loading };
};

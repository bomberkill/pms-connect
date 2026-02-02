import { useQuery } from "@apollo/client";
import { buildGetFollowersCountQuery, buildGetFollowingCountQuery } from "@/graphql/queries/user";

/**
 * Hook to fetch user statistics (followers, following, posts counts)
 * @param userId - The user ID to fetch stats for
 * @param postsCount - Optional posts count from existing posts array
 * @returns Object with followersCount, followingCount, postsCount, and loading state
 */
export const useUserCounts = (userId: string, postsCount?: number) => {
    const { data: followersData, loading: followersLoading, error: followersError } = useQuery(
        buildGetFollowersCountQuery(),
        {
            variables: { userId },
            skip: !userId,
            fetchPolicy: 'cache-and-network', // ✅ Added
        }
    );

    const { data: followingData, loading: followingLoading, error: followingError } = useQuery(
        buildGetFollowingCountQuery(),
        {
            variables: { userId },
            skip: !userId,
            fetchPolicy: 'cache-and-network', // ✅ Added
        }
    );

    return {
        followersCount: followersData?.getFollowersCount || 0,
        followingCount: followingData?.getFollowingCount || 0,
        postsCount: postsCount || 0,
        loading: followersLoading || followingLoading,
        error: followersError || followingError, // ✅ Added
    };
};

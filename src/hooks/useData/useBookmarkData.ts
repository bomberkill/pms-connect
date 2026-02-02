import { buildAddBookmarkMutation, buildRemoveBookmarkMutation, buildGetMyBookmarksQuery } from "@/graphql/queries/bookmark";
import { BookmarkableTypeGQL, Bookmark } from "@/types/Bookmark";
import { Comment } from "@/types/Comment";
import { Post } from "@/types/Post";
import { useMutation, useQuery, gql } from "@apollo/client";

// =============================================================================
// == BOOKMARKS
// =============================================================================

/**
 * Hook to fetch the current user's bookmarks.
 */
export const useMyBookmarks = () => {
  const { data, loading, error, refetch } = useQuery<{ myBookmarks: Bookmark[] }>(
    buildGetMyBookmarksQuery(),
    {
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    bookmarks: data?.myBookmarks || [],
    loading,
    error,
    refetch,
  };
};


/**
 * Hook that provides add/remove bookmark actions.
 */
export const useBookmarkActions = (itemId: string, itemType: 'Post' | 'Comment') => {
  const [addBookmark, { loading: adding, error: addError }] = useMutation<
    { addBookmark: boolean },
    { itemId: string; itemType: BookmarkableTypeGQL }
  >(buildAddBookmarkMutation(), {
    variables: { itemId, itemType: itemType === 'Post' ? BookmarkableTypeGQL.POST : BookmarkableTypeGQL.COMMENT },
    optimisticResponse: {
      addBookmark: true
      // addBookmark: {
      //   __typename: 'Bookmark',
      //   id: 'temp-bookmark-id',
      //   item: { id: itemId },
      //   createdAt: new Date().toISOString(),
      // }, // Using 'any' because item is a union and we only need the id for optimistic update
    },
    update: (cache) => {
      const id = `${itemType}:${itemId}`;
      const fragment = gql`
        fragment ItemBookmark on ${itemType} {
          isBookmarked
        }
      `;
      const item = cache.readFragment<Post | Comment>({ id, fragment });
      if (item) {
        cache.writeFragment({
          id,
          fragment,
          data: {
            ...item,
            isBookmarked: true,
          },
        });
      }
    },
  });

  const [removeBookmark, { loading: removing, error: removeError }] = useMutation<
    { removeBookmark: boolean },
    { itemId: string }
  >(buildRemoveBookmarkMutation(), {
    variables: { itemId },
    optimisticResponse: {
      removeBookmark: true,
    },
    update: (cache) => {
      const id = `${itemType}:${itemId}`;
      const fragment = gql`
        fragment ItemBookmark on ${itemType} {
          isBookmarked
        }
      `;
      const item = cache.readFragment<Post | Comment>({ id, fragment });
      if (item) {
        cache.writeFragment({
          id,
          fragment,
          data: {
            ...item,
            isBookmarked: false,
          },
        });
      }
    },
  });

  return { addBookmark, adding, addError, removeBookmark, removing, removeError };
};
import { buildAddBookmarkMutation, buildRemoveBookmarkMutation, buildGetMyBookmarksQuery } from "@/graphql/queries/bookmark";
import { BookmarkableTypeGQL, Bookmark } from "@/types/Bookmark";
import { useMutation, useQuery } from "@apollo/client";

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
    },
    update: (cache) => {
      cache.modify({
        id: cache.identify({ __typename: itemType, id: itemId }),
        fields: {
          isBookmarked: () => true,
        },
      });
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
      cache.modify({
        id: cache.identify({ __typename: itemType, id: itemId }),
        fields: {
          isBookmarked: () => false,
        },
      });
    },
  });

  return { addBookmark, adding, addError, removeBookmark, removing, removeError };
};
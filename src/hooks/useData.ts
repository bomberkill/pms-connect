// import { useQuery, useMutation, gql } from '@apollo/client';
// import {
//   // User
//   buildGetAllUsersQuery,
//   // Feed & Post
//   buildGetFeedQuery,
//   buildGetPostByIdQuery,
//   buildCreatePostMutation,
//   buildUpdatePostMutation,
//   buildRemovePostMutation,
//   buildLikePostMutation,
//   buildUnlikePostMutation,
//   // Comment
//   buildGetCommentsByPostQuery,
//   buildAddCommentMutation,
//   buildRemoveCommentMutation,
//   // Follow
//   buildFollowMutation,
//   buildUnfollowMutation,
//   // Connection
//   buildSendConnectionRequestMutation,
//   buildAcceptConnectionRequestMutation,
//   buildDeclineOrCancelConnectionRequestMutation,
//   buildGetMyConnectionRequestsQuery,
//   buildRemoveConnectionMutation,
//   buildGetMeQuery
// } from '@/graphql/queries';
// import { User } from '@/types/User';
// import { ConnectionRequest, ConnectionRequestStatus } from '@/types/ConnectionRequest';
// import { useAppSelector } from '@/lib/hooks';
// import { Post, CreatePostInput, UpdatePostInput } from '@/types/Post';
// import { Comment, CreateCommentInput } from '@/types/Comment';
// import { setUser } from '@/redux/slices/userSlice';
// import { ref } from 'process';

// // =============================================================================
// // == USER & SUGGESTIONS
// // =============================================================================

// interface UseUserSuggestionsOptions {
//   limit?: number;
// }

// /**
//  * Hook personnalisé pour récupérer une liste de suggestions d'utilisateurs.
//  * Il encapsule la logique d'appel à `useQuery`, la gestion des variables,
//  * et le formatage des données de retour.
//  */
// export const useUserSuggestions = (options: UseUserSuggestionsOptions = {}) => { // TODO: Rename to useUsers
//   const { limit = 5 } = options;
//   const { user } = useAppSelector((state) => state.user);

//   const { data, loading, error, ...rest } = useQuery(buildGetAllUsersQuery(), {
//     variables: { limit },
//     // On ne lance la requête que si l'utilisateur est connecté
//     skip: !user,
//   });

//   // On retourne un objet propre avec les données déjà formatées.
//   const suggestions: User[] = data?.getAllUsers || [];

//   return { suggestions, loading, error, ...rest };
// };

// export const useGetMe = () => {
//   const { user } = useAppSelector((state) => state.user);
//   const { data, loading, error, refetch } = useQuery<{ me: User }>(buildGetMeQuery(), {
//     skip: !user,
//     fetchPolicy: 'cache-and-network',
//   });
//   console.log('useGetMe - data:', data)
//   const me: User | undefined = data?.me;
//   if (me && me !== user) {
//     setUser(me);
//   }

//   return { me, loading, error, refetch };
// }

// // =============================================================================
// // == FEED & POSTS
// // =============================================================================

// /**
//  * Hook personnalisé pour récupérer le fil d'actualité (feed).
//  * Gère la pagination pour un défilement infini.
//  */
// export const useFeed = (options: { limit?: number } = {}) => {
//   const { limit = 10 } = options;

//   const { data, loading, error, fetchMore } = useQuery<{ getFeed: Post[] }>(buildGetFeedQuery(), {
//     variables: { limit, skip: 0 },
//     // 'cache-and-network' affiche les données du cache puis rafraîchit depuis le réseau.
//     fetchPolicy: 'cache-and-network',
//   });

//   const posts: Post[] = data?.getFeed || [];

//   return {
//     posts,
//     loading,
//     error,
//     loadMore: () => fetchMore({
//       variables: {
//         skip: posts.length,
//       },
//     })
//   };
// };

// /**
//  * Hook pour récupérer un post unique par son ID.
//  */
// export const usePost = (postId: string) => {
//   const { data, loading, error } = useQuery<{ getPostById: Post }>(
//     buildGetPostByIdQuery(),
//     {
//       variables: { id: postId },
//       skip: !postId,
//     }
//   );

//   return { post: data?.getPostById, loading, error };
// }

// /**
//  * Hook qui fournit les actions de mutation pour les posts (créer, mettre à jour, supprimer).
//  */
// export const usePostMutations = () => {
//   const [createPost, { loading: creating, error: createError }] = useMutation<
//     { createPost: Post }, { createPostInput: CreatePostInput }
//   >(buildCreatePostMutation(), {
//     refetchQueries: ['GetFeed'], // Rafraîchit le feed après la création
//   });

//   const [updatePost, { loading: updating, error: updateError }] = useMutation<
//     { updatePost: Post }, { postId: string; updatePostInput: UpdatePostInput }
//   >(buildUpdatePostMutation());

//   const [removePost, { loading: removing, error: removeError }] = useMutation<
//     { removePost: boolean }, { id: string }
//   >(buildRemovePostMutation(), {
//     refetchQueries: ['GetFeed'], // Rafraîchit le feed après la suppression
//   });

//   return { createPost, creating, createError, updatePost, updating, updateError, removePost, removing, removeError };
// };

// /**
//  * Hook personnalisé pour les actions sur un post (like, unlike).
//  * Il gère les mises à jour optimistes pour une UI réactive.
//  */
// export const usePostActions = (postId: string) => {
//   const [likePost, { loading: liking }] = useMutation(buildLikePostMutation(), {
//     variables: { postId },
//     optimisticResponse: {
//       likePost: true,
//     },
//     update: (cache) => {
//       // Met à jour le cache d'Apollo directement
//       const id = `Post:${postId}`;
//       const fragment = gql`
//         fragment MyPost on Post {
//           isLiked
//           likesCount
//         }
//       `;
//       const post = cache.readFragment<Post>({ id, fragment });
//       if (post) {
//         cache.writeFragment({
//           id,
//           fragment,
//           data: {
//             ...post,
//             isLiked: true,
//             likesCount: post.likesCount + 1,
//           },
//         });
//       }
//     },
//   });

//   const [unlikePost, { loading: unliking }] = useMutation(buildUnlikePostMutation(), {
//     variables: { postId },
//     optimisticResponse: {
//       unlikePost: true,
//     },
//     update: (cache) => {
//       const id = `Post:${postId}`;
//       const fragment = gql`
//         fragment MyPost on Post {
//           isLiked
//           likesCount
//         }
//       `;
//       const post = cache.readFragment<Post>({ id, fragment });
//       if (post) {
//         cache.writeFragment({
//           id,
//           fragment,
//           data: {
//             ...post,
//             isLiked: false,
//             likesCount: post.likesCount - 1,
//           },
//         });
//       }
//     },
//   });

//   return { likePost, liking, unlikePost, unliking };
// };

// // =============================================================================
// // == COMMENTS
// // =============================================================================

// /**
//  * Hook pour récupérer les commentaires d'un post.
//  */
// export const useComments = (postId: string) => {
//   const { data, loading, error, fetchMore } = useQuery<{ getCommentsByPost: Comment[] }>(
//     buildGetCommentsByPostQuery(),
//     {
//       variables: { postId, limit: 10, skip: 0 },
//       fetchPolicy: 'cache-and-network',
//       skip: !postId,
//     }
//   );

//   return { comments: data?.getCommentsByPost || [], loading, error, fetchMore };
// };

// /**
//  * Hook qui fournit les actions de mutation pour les commentaires (ajouter, supprimer).
//  */
// export const useCommentActions = () => {
//   const [addComment, { loading: adding, error: addError }] = useMutation<
//     { addComment: Comment }, { createCommentInput: CreateCommentInput }
//   >(buildAddCommentMutation(), {
//     update(cache, { data }) {
//       if (!data?.addComment) return;
//       cache.modify({
//         id: `Post:${(data.addComment as any).postId}`,
//         fields: {
//           commentsCount(currentCount = 0) { return currentCount + 1; }
//         }
//       });
//     },
//     refetchQueries: ['GetCommentsByPost'], // Rafraîchit les commentaires après l'ajout
//   });

//   const [removeComment, { loading: removing, error: removeError }] = useMutation<
//     { removeComment: boolean }, { commentId: string }
//   >(buildRemoveCommentMutation());

//   return { addComment, adding, addError, removeComment, removing, removeError };
// };

// // =============================================================================
// // == CONNECTIONS & FOLLOWS
// // =============================================================================

// /**
//  * Hook pour récupérer les demandes de connexion de l'utilisateur courant.
//  * @returns L'état de la requête (demandes, chargement, erreur, refetch).
//  */
// export const useConnectionRequests = (status?: ConnectionRequestStatus) => {
//   const { data, loading, error, refetch } = useQuery<{ getMyConnectionRequests: ConnectionRequest[] }>(
//     buildGetMyConnectionRequestsQuery(), {
//       variables: { status },
//       // Affiche le cache, puis rafraîchit depuis le réseau pour toujours avoir les données à jour.
//       fetchPolicy: 'cache-and-network',
//     }
//   );

//   return {
//     requests: data?.getMyConnectionRequests || [],
//     loading,
//     error,
//     refetch,
//   };
// }

// /**
//  * Hook qui fournit les actions de suivi (follow/unfollow) d'un utilisateur.
//  * @returns Les fonctions de mutation et leurs états de chargement.
//  */
// export const useFollowActions = (userId: string) => {
//   const [followUser, { loading: following, error: followError }] = useMutation(buildFollowMutation(), {
//     variables: { userId },
//     refetchQueries: ['GetMe'] // Rafraîchit les données de l'utilisateur après le suivi
//   });

//   const [unfollowUser, { loading: unfollowing, error: unfollowError }] = useMutation(buildUnfollowMutation(), {
//     variables: { userId },
//     refetchQueries: ['GetMe'] // Rafraîchit les données de l'utilisateur après l'action
//   });

//   return { followUser, following, followError, unfollowUser, unfollowing, unfollowError };
// };

// /**
//  * Hook qui fournit les actions liées aux demandes de connexion.
//  * @returns Les fonctions de mutation et leurs états de chargement.
//  */
// export const useConnectionActions = (userId?: string, requestId?: string) => {
//   const [sendRequest, { loading: sending, error: sendError }] = useMutation(buildSendConnectionRequestMutation(), {
//     variables: { recipientId: userId },
//     // On pourrait vouloir rafraîchir la liste des suggestions ou le profil de l'utilisateur
//     refetchQueries: ["GetMyConnectionRequests"] // Ou mettre à jour le cache manuellement
//   });

//   const [acceptRequest, { loading: accepting, error: acceptError }] = useMutation(buildAcceptConnectionRequestMutation(), {
//     variables: { requestId },
//     // Rafraîchit les demandes de connexion et les données de l'utilisateur (pour la liste de connexions)
//     refetchQueries: ['GetMyConnectionRequests', 'GetMe']
//   });

//   const [declineRequest, { loading: declining, error: declineError }] = useMutation(buildDeclineOrCancelConnectionRequestMutation(), {
//     variables: { requestId },
//     // Rafraîchit uniquement la liste des demandes de connexion
//     refetchQueries: ['GetMyConnectionRequests']
//   });

//   const [removeConnection, { loading: removing, error: removeError }] = useMutation(buildRemoveConnectionMutation(), {
//     variables: { userIdB: userId },
//     // Rafraîchit les données de l'utilisateur (pour la liste de connexions)
//     refetchQueries: ['GetMyConnectionRequests', 'GetMe']
//   });

//   return {
//     sendRequest,
//     sending,
//     sendError,
//     acceptRequest,
//     accepting,
//     acceptError,
//     declineRequest,
//     declining,
//     declineError,
//     removeConnection,
//     removing,
//     removeError,
//   };
// };
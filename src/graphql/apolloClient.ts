"use client"

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
  Observable,
  split
} from "@apollo/client";
import { errorLink } from "@/lib/apolloErrorLink";
import { getFirebaseToken } from "./firebaseAuth";
import { createClient } from "graphql-ws";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";

// import { TOKEN_KEY } from "../authProvider"; // We'll use this to get the auth token

// Fetch the GraphQL API URL from environment variables
// Use NEXT_PUBLIC_ prefix for client-side access in Next.js
const GRAPHQL_API_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "http://localhost:8000/graphql";

const WEBSOCKET_URL = GRAPHQL_API_URL.replace(/^http/, 'ws');

const httpLink = createHttpLink({
  uri: GRAPHQL_API_URL,
});

// Middleware for adding the authentication token to requests
const authLink = new ApolloLink((operation, forward) => {
  return new Observable(observer => {
    (async () => {
      try {
        const token = await getFirebaseToken();

        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : "",
          },
        }));

        const subscriber = forward(operation).subscribe({
          next: result => observer.next(result),
          error: err => observer.error(err),
          complete: () => observer.complete(),
        });

        return () => {
          if (subscriber) subscriber.unsubscribe();
        };
      } catch (error) {
        observer.error(error);
      }
    })();
  });
});

const wsLink = new GraphQLWsLink(createClient({
  url: WEBSOCKET_URL,
  connectionParams: async () => {
    const token = await getFirebaseToken();
    // console.log('Attempting to connect to WebSocket with token:', token);
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      }
    };
  },
}));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);



export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, splitLink]), // Links are chained; order matters
  cache: new InMemoryCache({
    typePolicies: {
      // Type normalization - use _id as key field for all types
      User: {
        keyFields: ['id'],
      },
      Post: {
        keyFields: ['id'],
      },
      Group: {
        keyFields: ['id'],
      },
      Comment: {
        keyFields: ['id'],
      },

      Query: {
        fields: {
          // ========== FEED ==========
          getFeed: {
            // Ne pas mettre en cache les résultats en fonction des arguments (comme `skip` et `limit`)
            keyArgs: false,
            merge(existing = [], incoming = [], { args, readField }) {
              // Sécurité: si rien d'entrant, retourne l'existant
              if (!incoming || incoming.length === 0) {
                return existing;
              }

              // Si la requête est la première page (skip === 0), 
              // on peut vouloir **préserver les posts entrants en tête**
              // et ensuite ajouter les anciens sans doublons.
              const isFirstPage = args && (args.skip === 0 || args.skip === undefined);

              // Helper pour extraire l'id d'une référence ou d'un objet normalisé
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const getId = (item: any) => readField('id', item) || readField('_id', item) || null;

              // Construire le Set d'IDs existants (à partir des éléments actuellement en cache)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const merged: any[] = isFirstPage ? [] : existing.slice(); // si première page on recommence
              const existingIds = new Set(merged.map(item => getId(item)));

              // Si c'est la première page on veut **préserver l'ordre entrant** (nouveaux en tête)
              if (isFirstPage) {
                // Add incoming first (si pas déjà présent)
                for (const item of incoming) {
                  const id = getId(item);
                  if (!existingIds.has(id)) {
                    merged.push(item);
                    existingIds.add(id);
                  }
                }
                // puis ajouter les anciens (existing) s'ils ne sont pas déjà présents
                for (const item of existing) {
                  const id = getId(item);
                  if (!existingIds.has(id)) {
                    merged.push(item);
                    existingIds.add(id);
                  }
                }
              } else {
                // Pour pages suivantes (infinite scroll) on append les incoming sans doublons
                for (const item of incoming) {
                  const id = getId(item);
                  if (!existingIds.has(id)) {
                    merged.push(item);
                    existingIds.add(id);
                  }
                }
              }

              return merged;
            },
          },

          // ========== GROUPS ==========
          getGroups: {
            keyArgs: ['search', 'privacy'], // Cache séparé par filtres
            merge(existing = [], incoming = [], { args }) {
              // Si première page, remplacer complètement
              if (args?.skip === 0 || args?.skip === undefined) {
                return incoming;
              }
              // Sinon, append pour pagination
              return [...existing, ...incoming];
            },
          },

          getGroupMembers: {
            keyArgs: ['groupId'], // Cache séparé par groupe
            merge(existing = [], incoming = []) {
              // Toujours append pour pagination
              return [...existing, ...incoming];
            },
          },

          // ========== POSTS ==========
          getPostsByAuthor: {
            keyArgs: ['authorId'], // Cache séparé par auteur
            merge(existing = [], incoming = [], { args }) {
              if (args?.skip === 0 || args?.skip === undefined) {
                return incoming;
              }
              return [...existing, ...incoming];
            },
          },

          getPostsByGroup: {
            keyArgs: ['groupId'], // Cache séparé par groupe
            merge(existing = [], incoming = [], { args }) {
              if (args?.skip === 0 || args?.skip === undefined) {
                return incoming;
              }
              return [...existing, ...incoming];
            },
          },

          // ========== FOLLOWERS/FOLLOWING ==========
          getFollowers: {
            keyArgs: ['userId'], // Cache séparé par utilisateur
            merge(existing = [], incoming = []) {
              return [...existing, ...incoming];
            },
          },

          getFollowing: {
            keyArgs: ['userId'], // Cache séparé par utilisateur
            merge(existing = [], incoming = []) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  // connectToDevTools: import.meta., 
});
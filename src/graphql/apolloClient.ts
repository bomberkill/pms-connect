"use client"

import {
    ApolloClient,
    InMemoryCache,
    createHttpLink,
    ApolloLink,
    Observable,
    split
  } from "@apollo/client";
  import { onError } from "@apollo/client/link/error";
import { getFirebaseToken } from "./firebaseAuth";
import { createClient } from "graphql-ws";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
  // import { TOKEN_KEY } from "../authProvider"; // We'll use this to get the auth token
  
  // Fetch the GraphQL API URL from environment variables
  // Make sure to set this in your .env.local file (e.g., VITE_GRAPHQL_API_URL=http://localhost:4000/graphql)
  const GRAPHQL_API_URL =
    // process.env.GRAPHQL_API_URL || "https://pms-connect-api.onrender.com/graphql";
    process.env.GRAPHQL_API_URL || "http://localhost:8000/graphql";

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
  
  // Link for logging GraphQL errors and network errors
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
        ),
      );
    if (networkError) console.error(`[Network error]: ${networkError}`);
  });
  
  export const apolloClient = new ApolloClient({
    link: ApolloLink.from([errorLink, splitLink]), // Links are chained; order matters
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
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
          },
        },
      },
    }),
    // connectToDevTools: import.meta., 
  });
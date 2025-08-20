"use client"

import {
    ApolloClient,
    InMemoryCache,
    createHttpLink,
    ApolloLink,
    Observable,
  } from "@apollo/client";
  import { onError } from "@apollo/client/link/error";
import { getFirebaseToken } from "./firebaseAuth";
  // import { TOKEN_KEY } from "../authProvider"; // We'll use this to get the auth token
  
  // Fetch the GraphQL API URL from environment variables
  // Make sure to set this in your .env.local file (e.g., VITE_GRAPHQL_API_URL=http://localhost:4000/graphql)
  const GRAPHQL_API_URL =
    process.env.GRAPHQL_API_URL || "https://pms-connect-api.onrender.com/graphql";
  
  const httpLink = createHttpLink({
    uri: GRAPHQL_API_URL,
  });
  
  // Middleware for adding the authentication token to requests
  const authLink = new ApolloLink((operation, forward) => {
    // const token = localStorage.getItem(TOKEN_KEY);
  
    // operation.setContext({
    //   headers: {
    //     authorization: token ? `Bearer ${token}` : "",
    //   },
    // });
  
    // return forward(operation);
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
    link: ApolloLink.from([errorLink, authLink, httpLink]), // Links are chained; order matters
    cache: new InMemoryCache(),
    // connectToDevTools: import.meta., 
  });
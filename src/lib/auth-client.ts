import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [jwtClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

/**
 * Fetches a fresh JWT (signed by Better Auth, verifiable by the NestJS
 * backend via its JWKS endpoint) for the current session, to attach as a
 * Bearer token on outgoing GraphQL requests.
 */
export async function getAuthToken(): Promise<string | null> {
  const { data } = await authClient.$fetch<{ token: string }>("/token");
  return data?.token ?? null;
}

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [jwtClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// In-memory cache so every GraphQL request/WebSocket (re)connect doesn't
// each round-trip to Better Auth for a fresh JWT — that request pattern is
// exactly what turns a reconnecting subscription into a flood of
// /api/auth/token + /api/auth/get-session calls, one per attempt.
let cachedToken: { token: string; expiresAt: number } | null = null;

function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Returns a JWT (signed by Better Auth, verifiable by the NestJS backend via
 * its JWKS endpoint) for the current session, to attach as a Bearer token on
 * outgoing GraphQL requests — reusing a cached one until shortly before it
 * expires instead of fetching a new one on every call.
 */
export async function getAuthToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 10_000 > now) {
    return cachedToken.token;
  }

  const { data } = await authClient.$fetch<{ token: string }>("/token");
  const token = data?.token ?? null;
  if (!token) {
    cachedToken = null;
    return null;
  }

  const expiresAt = decodeJwtExpiryMs(token) ?? now + 60_000;
  cachedToken = { token, expiresAt };
  return token;
}

/** Drop the cached token — call this on logout so a new session always gets a fresh one. */
export function clearAuthTokenCache(): void {
  cachedToken = null;
}

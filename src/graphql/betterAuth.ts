import { authClient, getAuthToken } from "@/lib/auth-client";

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string | null;
}

export class AuthApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AuthApiError";
  }
}

function toAuthUser(user: {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    image: user.image,
  };
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await authClient.signIn.email({ email, password });
  if (error || !data) {
    throw new AuthApiError(error?.code ?? "UNKNOWN_ERROR", error?.message ?? "Login failed");
  }
  return toAuthUser(data.user);
}

export async function logout(): Promise<void> {
  await authClient.signOut();
}

/**
 * Better Auth's social sign-in is redirect-based (it navigates the browser
 * to Google then back to `callbackURL`), unlike Firebase's popup flow. The
 * caller does not get a user back synchronously — observe `useSession()` (or
 * `useAuthObserver`) after the redirect completes instead.
 */
export async function signInWithGoogle(callbackURL: string = "/"): Promise<void> {
  await authClient.signIn.social({ provider: "google", callbackURL });
}

export async function sendVerificationEmail(email: string, callbackURL: string = "/"): Promise<void> {
  const { error } = await authClient.sendVerificationEmail({ email, callbackURL });
  if (error) {
    throw new AuthApiError(error.code ?? "UNKNOWN_ERROR", error.message ?? "Could not send verification email");
  }
}

export async function resetPassword(email: string, redirectTo: string = "/reset-password"): Promise<void> {
  const { error } = await authClient.requestPasswordReset({ email, redirectTo });
  if (error) {
    throw new AuthApiError(error.code ?? "UNKNOWN_ERROR", error.message ?? "Could not send reset email");
  }
}

export async function updateAuthEmail(newEmail: string, callbackURL: string = "/"): Promise<void> {
  const { error } = await authClient.changeEmail({ newEmail, callbackURL });
  if (error) {
    throw new AuthApiError(error.code ?? "UNKNOWN_ERROR", error.message ?? "Could not update email");
  }
}

export { getAuthToken };

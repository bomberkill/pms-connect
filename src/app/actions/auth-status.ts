"use server";

import { auth } from "@/lib/auth";

/**
 * Checks whether an account's email is verified by reading Better Auth's own
 * database directly, instead of the local session cookie. Unlike
 * `getSession()`, this works regardless of which device clicked the
 * verification link — the wizard tab polling this doesn't need to be the
 * same browser that completed verification.
 */
export async function checkEmailVerified(email: string): Promise<boolean> {
  const ctx = await auth.$context;
  const result = await ctx.internalAdapter.findUserByEmail(
    email.toLowerCase(),
  );
  return !!result?.user?.emailVerified;
}

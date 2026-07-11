"use server";

import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import type { UploadPurpose } from "@/utils/fileUpload";

const GRAPHQL_API_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "http://localhost:8000/graphql";

async function graphqlRequest(
  query: string,
  variables: Record<string, unknown>,
  token: string,
) {
  const res = await fetch(GRAPHQL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

async function uploadToR2(
  file: File,
  purpose: UploadPurpose,
  token: string,
  uploadedKeys: string[],
): Promise<string> {
  const data = await graphqlRequest(
    `mutation($input: GetUploadUrlInput!) { getUploadUrl(input: $input) { uploadUrl publicUrl key } }`,
    { input: { purpose, fileName: file.name, contentType: file.type } },
    token,
  );
  const { uploadUrl, publicUrl, key } = data.getUploadUrl;
  uploadedKeys.push(key);

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Failed to upload file to storage (${putRes.status}).`);
  }
  return publicUrl;
}

async function deleteFromR2(key: string, token: string) {
  await graphqlRequest(
    `mutation($key: String!) { deleteUploadedFile(key: $key) }`,
    { key },
    token,
  ).catch((err) => console.error("Failed to roll back uploaded file:", err));
}

export interface CompleteRegistrationResult {
  success: boolean;
  error?: string;
  /** True for email/password signups: the account was created but the user
   *  was immediately signed back out and must verify + log in for real. */
  requiresEmailVerification?: boolean;
}

/**
 * Orchestrates the entire registration in one continuous server-side flow:
 * creates the Better Auth account (email/password) or reuses the existing
 * Google session, uploads any profile/cover/accreditation files to R2, then
 * creates the Mongo user profile — all in a single request, so the frontend
 * wizard never has to pause mid-flow to wait for email verification.
 *
 * For email/password signups the account is created with `emailVerified:
 * false` (see src/lib/auth.ts) and immediately signed back out afterward:
 * verification is enforced separately at login time (loginAndFetchUser in
 * userService.ts), not by blocking registration itself.
 */
export async function completeRegistration(
  formData: FormData,
): Promise<CompleteRegistrationResult> {
  const hdrs = await headers();
  const isGoogleSignup = formData.get("isGoogleSignup") === "1";

  let token: string;
  const requiresEmailVerification = !isGoogleSignup;

  if (isGoogleSignup) {
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session) {
      return { success: false, error: "UNAUTHENTICATED" };
    }
    token = (await auth.api.getToken({ headers: hdrs })).token;
  } else {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const signUpResult = await auth.api.signUpEmail({
        body: { email, password, name: email },
        headers: hdrs,
        asResponse: false,
      });
      if (!signUpResult.token) {
        return { success: false, error: "FAILED_TO_CREATE_SESSION" };
      }
      // signUpResult.token is the raw session token, not a JWT — the NestJS
      // backend needs a real JWT to verify via JWKS. `hdrs` was captured
      // before signUpEmail ran, so it doesn't carry the session cookie the
      // nextCookies plugin just set; read it back from the (mutable, same
      // request) cookie store to mint a real token from the fresh session.
      const cookieHeader = (await cookies())
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      const freshHeaders = new Headers(hdrs);
      freshHeaders.set("cookie", cookieHeader);
      const tokenResult = await auth.api.getToken({ headers: freshHeaders });
      if (!tokenResult.token) {
        return { success: false, error: "FAILED_TO_CREATE_SESSION" };
      }
      token = tokenResult.token;
    } catch (err) {
      const code = (err as { body?: { code?: string } })?.body?.code;
      return { success: false, error: code ?? "UNKNOWN_ERROR" };
    }
  }

  const uploadedKeys: string[] = [];
  try {
    const profilePicFile = formData.get("profilePicFile") as File | null;
    const coverPicFile = formData.get("coverPicFile") as File | null;
    const accreditationFiles = (
      formData.getAll("accreditationsFile") as File[]
    ).filter((f) => f.size > 0);

    const [profilePicUrl, coverPicUrl, accreditationUrls] = await Promise.all([
      profilePicFile && profilePicFile.size > 0
        ? uploadToR2(profilePicFile, "AVATAR", token, uploadedKeys)
        : Promise.resolve(""),
      coverPicFile && coverPicFile.size > 0
        ? uploadToR2(coverPicFile, "COVER_PICTURE", token, uploadedKeys)
        : Promise.resolve(""),
      Promise.all(
        accreditationFiles.map((file) =>
          uploadToR2(file, "ACCREDITATION_DOCUMENT", token, uploadedKeys),
        ),
      ),
    ]);

    const userData = {
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      userType: formData.get("userType") as string,
      bio: (formData.get("bio") as string) || undefined,
      websiteUrl: (formData.get("websiteUrl") as string) || undefined,
      location: JSON.parse(formData.get("location") as string),
      profilePicUrl,
      coverPicUrl,
      providers: JSON.parse((formData.get("providers") as string) || "[]"),
      professionalAccreditation: accreditationUrls.map((documentUrl) => ({
        documentUrl,
      })),
      firstName: (formData.get("firstName") as string) || undefined,
      lastName: (formData.get("lastName") as string) || undefined,
      speciality: (formData.get("speciality") as string) || undefined,
      professionalTitle:
        (formData.get("professionalTitle") as string) || undefined,
      entityName: (formData.get("entityName") as string) || undefined,
      entityType: (formData.get("entityType") as string) || undefined,
    };

    await graphqlRequest(
      `mutation($createUserInput: CreateUserInput!) { createUser(createUserInput: $createUserInput) { id } }`,
      { createUserInput: userData },
      token,
    );

    if (requiresEmailVerification) {
      await auth.api.signOut({ headers: hdrs });
    }

    return { success: true, requiresEmailVerification };
  } catch (error) {
    await Promise.all(uploadedKeys.map((key) => deleteFromR2(key, token)));
    if (requiresEmailVerification) {
      // Full rollback: we created this Better Auth account in this very
      // call, so delete it entirely rather than just signing out — leaving
      // it behind would take the email and block a clean retry.
      await auth.api
        .deleteUser({ headers: hdrs, body: {} })
        .catch((err) => console.error("Failed to roll back auth user:", err));
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "errors.unknown",
    };
  }
}

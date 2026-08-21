"use server";

import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import type { UploadPurpose } from "@/utils/fileUpload";

const GRAPHQL_API_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "http://localhost:8000/graphql";

function logRegistrationStep(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (details) {
    console.log(`[completeRegistration] ${step}`, details);
    return;
  }
  console.log(`[completeRegistration] ${step}`);
}

async function headersWithCurrentCookies(baseHeaders: Headers): Promise<Headers> {
  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const freshHeaders = new Headers(baseHeaders);
  if (cookieHeader) {
    freshHeaders.set("cookie", cookieHeader);
  }
  return freshHeaders;
}

async function graphqlRequest(
  query: string,
  variables: Record<string, unknown>,
  token: string,
) {
  logRegistrationStep("graphqlRequest:start", {
    hasToken: Boolean(token),
    apiUrl: GRAPHQL_API_URL,
    queryPreview: query.slice(0, 80),
  });
  const res = await fetch(GRAPHQL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ query, variables }),
  });
  logRegistrationStep("graphqlRequest:response", {
    status: res.status,
    ok: res.ok,
  });
  const json = await res.json();
  if (json.errors?.length) {
    logRegistrationStep("graphqlRequest:error", {
      errors: json.errors,
    });
    throw new Error(json.errors[0].message);
  }
  logRegistrationStep("graphqlRequest:success");
  return json.data;
}

async function uploadToR2(
  file: File,
  purpose: UploadPurpose,
  token: string,
  uploadedKeys: string[],
): Promise<string> {
  logRegistrationStep("uploadToR2:start", {
    fileName: file.name,
    size: file.size,
    type: file.type,
    purpose,
  });
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
  logRegistrationStep("uploadToR2:putResponse", {
    status: putRes.status,
    ok: putRes.ok,
    key,
  });
  if (!putRes.ok) {
    throw new Error(`Failed to upload file to storage (${putRes.status}).`);
  }
  logRegistrationStep("uploadToR2:success", { key });
  return publicUrl;
}

async function deleteFromR2(key: string, token: string) {
  logRegistrationStep("deleteFromR2:start", { key });
  await graphqlRequest(
    `mutation($key: String!) { deleteUploadedFile(key: $key) }`,
    { key },
    token,
  ).catch((err) => console.error("Failed to roll back uploaded file:", err));
  logRegistrationStep("deleteFromR2:end", { key });
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
  logRegistrationStep("start", {
    isGoogleSignup,
    email: formData.get("email"),
    userType: formData.get("userType"),
    hasProfilePic: Boolean((formData.get("profilePicFile") as File | null)?.size),
    hasCoverPic: Boolean((formData.get("coverPicFile") as File | null)?.size),
    accreditationCount: formData.getAll("accreditationsFile").length,
  });

  let token: string;
  const requiresEmailVerification = !isGoogleSignup;

  if (isGoogleSignup) {
    try {
      logRegistrationStep("googleSignup:bootstrap:start");
      const freshHeaders = await headersWithCurrentCookies(hdrs);
      const session = await auth.api.getSession({ headers: freshHeaders });
      logRegistrationStep("googleSignup:getSession:done", {
        hasSession: Boolean(session),
      });
      if (!session) {
        return { success: false, error: "UNAUTHENTICATED" };
      }

      const tokenResult = await auth.api.getToken({ headers: freshHeaders });
      logRegistrationStep("googleSignup:getToken:done", {
        hasToken: Boolean(tokenResult.token),
      });
      if (!tokenResult.token) {
        return { success: false, error: "FAILED_TO_CREATE_SESSION" };
      }
      token = tokenResult.token;
    } catch (error) {
      console.error("Failed to bootstrap Google registration session:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "FAILED_TO_BOOTSTRAP_GOOGLE_SESSION",
      };
    }
  } else {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      logRegistrationStep("emailSignup:signUp:start", {
        email,
        hasPassword: Boolean(password),
      });
      const signUpResult = await auth.api.signUpEmail({
        body: { email, password, name: email },
        headers: hdrs,
        asResponse: false,
      });
      logRegistrationStep("emailSignup:signUp:done", {
        hasSessionToken: Boolean(signUpResult.token),
      });
      if (!signUpResult.token) {
        return { success: false, error: "FAILED_TO_CREATE_SESSION" };
      }
      // signUpResult.token is the raw session token, not a JWT — the NestJS
      // backend needs a real JWT to verify via JWKS. `hdrs` was captured
      // before signUpEmail ran, so it doesn't carry the session cookie the
      // nextCookies plugin just set; read it back from the (mutable, same
      // request) cookie store to mint a real token from the fresh session.
      const freshHeaders = await headersWithCurrentCookies(hdrs);
      const tokenResult = await auth.api.getToken({ headers: freshHeaders });
      logRegistrationStep("emailSignup:getToken:done", {
        hasToken: Boolean(tokenResult.token),
      });
      if (!tokenResult.token) {
        return { success: false, error: "FAILED_TO_CREATE_SESSION" };
      }
      token = tokenResult.token;
    } catch (err) {
      console.error("Failed to bootstrap email registration session:", err);
      // `body.code` is only present for Better Auth's own APIError shape
      // (e.g. USER_ALREADY_EXISTS, invalid input) — those messages are
      // written for end users. Anything else (a raw Prisma/DB error, a
      // network failure) is an internal error whose message can contain
      // driver/schema internals, so it's logged above but never shown.
      const code = (err as { body?: { code?: string } })?.body?.code;
      return {
        success: false,
        error: code ?? "FAILED_TO_CREATE_SESSION",
      };
    }
  }

  const uploadedKeys: string[] = [];
  try {
    logRegistrationStep("uploads:start");
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
    logRegistrationStep("uploads:done", {
      uploadedKeys,
      accreditationCount: accreditationUrls.length,
    });

    const userData = {
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      userType: formData.get("userType") as string,
      bio: (formData.get("bio") as string) || undefined,
      websiteUrl: (formData.get("websiteUrl") as string) || undefined,
      location: formData.has("location")
        ? JSON.parse(formData.get("location") as string)
        : undefined,
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
    logRegistrationStep("createUser:start", {
      email: userData.email,
      userType: userData.userType,
      providers: userData.providers,
    });

    await graphqlRequest(
      `mutation($createUserInput: CreateUserInput!) { createUser(createUserInput: $createUserInput) { id } }`,
      { createUserInput: userData },
      token,
    );
    logRegistrationStep("createUser:success");

    if (requiresEmailVerification) {
      logRegistrationStep("signOutAfterSignup:start");
      await auth.api.signOut({ headers: hdrs });
      logRegistrationStep("signOutAfterSignup:done");
    }

    logRegistrationStep("success", {
      requiresEmailVerification,
    });
    return { success: true, requiresEmailVerification };
  } catch (error) {
    logRegistrationStep("failure", {
      message: error instanceof Error ? error.message : String(error),
      uploadedKeys,
    });
    await Promise.all(uploadedKeys.map((key) => deleteFromR2(key, token)));
    if (requiresEmailVerification) {
      // Full rollback: we created this Better Auth account in this very
      // call, so delete it entirely rather than just signing out — leaving
      // it behind would take the email and block a clean retry.
      logRegistrationStep("rollbackAuthUser:start");
      await auth.api
        .deleteUser({ headers: hdrs, body: {} })
        .catch((err) => console.error("Failed to roll back auth user:", err));
      logRegistrationStep("rollbackAuthUser:done");
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "errors.unknown",
    };
  }
}

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { sendMail } from "./mailer";

const trustedOrigins = Array.from(
  new Set(
    [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://192.168.0.4:3000",
      "https://pms-connect.vercel.app",
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      process.env.BETTER_AUTH_URL,
    ].filter((value): value is string => Boolean(value)),
  ),
);

// Better Auth manages its own auth-specific tables (user/session/account/
// verification/jwks) via Prisma, in a DEDICATED Postgres database — same
// Postgres server as pms-connect-api's domain schema, but a separate
// database (not just separate tables in the same one). Two independent
// Prisma projects (this one and pms-connect-api's) pointed at the same
// database is unsafe: `prisma db push`/`migrate dev` on either side treats
// tables it doesn't recognize as drift and can silently drop them.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Lets the app be reached from another device on the LAN (e.g. testing on
  // a phone) without Better Auth rejecting the request as cross-origin.
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    // Matches the mobile design system's password rule (12 chars minimum)
    // and the client-side yup schemas below it — Better Auth's own default
    // is 8, which the old yup schemas (min 6!) didn't even reach, so a
    // password that passed client validation could still be rejected by
    // the server. Keep both sides in sync if this changes.
    minPasswordLength: 12,
    // Deliberately false: Better Auth's own requireEmailVerification would
    // refuse to establish a session on signUp, which we need immediately
    // (registration creates the account, uploads files and creates the
    // Mongo profile in one continuous flow, then explicitly signs the user
    // back out). Verification is instead enforced by our own app code at
    // login time (see loginAndFetchUser in userService.ts), exactly like
    // before this flow existed.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe PMSCONNECT",
        html: `
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le lien suivant pour choisir un nouveau mot de passe :</p>
          <p><a href="${url}">${url}</a></p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <p>L'équipe PMSCONNECT</p>
        `,
        text: `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe.\nCopiez ce lien dans votre navigateur pour choisir un nouveau mot de passe :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nL'équipe PMSCONNECT`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Vérifiez votre adresse email - PMSCONNECT",
        html: `
          <p>Bonjour,</p>
          <p>Merci de vous être inscrit sur PMSCONNECT.</p>
          <p>Cliquez sur le lien suivant pour vérifier votre adresse email :</p>
          <p><a href="${url}">${url}</a></p>
          <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
          <p>L'équipe PMSCONNECT</p>
        `,
        text: `Bonjour,\n\nMerci de vous être inscrit sur PMSCONNECT.\nCopiez ce lien dans votre navigateur pour vérifier votre adresse email :\n${url}\n\nSi vous n'êtes pas à l'origine de cette inscription, ignorez cet email.\n\nL'équipe PMSCONNECT`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // Exposes /api/auth/jwks (verified by the NestJS backend) and
  // /api/auth/token (used by the frontend to attach a bearer token to
  // GraphQL requests).
  // nextCookies must be last: it's what makes auth.api.* calls (e.g. from
  // completeRegistration's Server Action) actually persist the session
  // cookie via next/headers, instead of only returning it in a Response
  // object nobody reads.
  plugins: [jwt(), nextCookies()],
});

// Plain `dotenv/config` only loads `.env`. Next.js itself layers in
// `.env.local` and `.env.development.local` (which is where the real local
// DATABASE_URL lives) when running `next dev`, but the Prisma CLI doesn't go
// through Next.js — load the same files here, in the same precedence order,
// so `npx prisma ...` sees the same DATABASE_URL as the running app.
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });
config({ path: ".env.development.local", override: true });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

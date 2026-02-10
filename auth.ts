import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "./src/lib/prisma";

if (!process.env.BETTER_AUTH_SECRET && !process.env.APP_SECRET) {
  console.warn("WARNING: BETTER_AUTH_SECRET is not set. Sessions will use an insecure default secret.");
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET || process.env.APP_SECRET || "insecure-dev-only-secret",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
    // Enable joins for performance on get-session etc.
    // NOTE: requires relations in schema; Better Auth CLI generated core relations.
  }),

  emailAndPassword: {
    enabled: true,
  },

  // 2FA routes are provided via the twoFactor() plugin below.

  experimental: {
    joins: true,
  },

  // Automatically set cookies in Next.js Server Actions when Better Auth returns Set-Cookie headers
  plugins: [twoFactor(), nextCookies()],
});

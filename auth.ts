import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "./src/lib/prisma";

const authSecret = process.env.BETTER_AUTH_SECRET || process.env.APP_SECRET;
if (!authSecret) {
  // next build sets NODE_ENV=production but NEXT_PHASE distinguishes build from runtime
  const isBuilding = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !isBuilding) {
    throw new Error("BETTER_AUTH_SECRET must be set in production");
  }
  console.warn("WARNING: BETTER_AUTH_SECRET is not set. Using insecure default for local dev only.");
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.APP_URL,
  secret: authSecret || "insecure-dev-only-secret",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
    // Enable joins for performance on get-session etc.
    // NOTE: requires relations in schema; Better Auth CLI generated core relations.
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },

  // 2FA routes are provided via the twoFactor() plugin below.

  experimental: {
    joins: true,
  },

  // Automatically set cookies in Next.js Server Actions when Better Auth returns Set-Cookie headers
  plugins: [twoFactor(), nextCookies()],
});

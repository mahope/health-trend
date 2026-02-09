"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/plugins";

const runtimeBaseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient({
  baseURL: runtimeBaseUrl,
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        // If Better Auth indicates 2FA verification is required after sign-in
        window.location.href = "/two-factor";
      },
    }),
  ],
});

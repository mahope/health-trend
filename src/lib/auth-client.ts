"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        // If Better Auth indicates 2FA verification is required after sign-in
        window.location.href = "/two-factor";
      },
    }),
  ],
});

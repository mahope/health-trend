"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6">
        <h1 className="text-xl font-semibold">Health Trend</h1>
        <p className="text-sm text-neutral-500 mt-1">Log ind</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            className="w-full rounded-md bg-black text-white py-2 disabled:opacity-50"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await authClient.signIn.email({
                  email,
                  password,
                });
                if (res.error) {
                  setError(res.error.message);
                } else {
                  window.location.href = "/";
                }
              } catch (e: unknown) {
                const msg =
                  e instanceof Error
                    ? e.message
                    : typeof e === "string"
                      ? e
                      : "Login fejlede";
                setError(msg);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Logger ind…" : "Log ind"}
          </button>
        </div>

        <p className="text-xs text-neutral-500 mt-4">
          2FA (TOTP) kan aktiveres i Settings efter login.
        </p>
      </div>
    </main>
  );
}

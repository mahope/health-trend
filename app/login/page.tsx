"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-white to-white dark:from-neutral-950 dark:via-black dark:to-black" />
        <div className="absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardHeader
            title="Health Trend"
            description="Log ind for at se snapshots, manuel kontekst og AI-brief."
          />
          <CardBody>
            <div className="space-y-3">
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              {error && <div className="text-sm text-red-600">{error}</div>}

              <Button
                variant="primary"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const res = await authClient.signIn.email({ email, password });
                    if (res.error) setError(res.error.message || "Forkert email eller kodeord");
                    else window.location.href = "/";
                  } catch (e: unknown) {
                    setError(e instanceof Error ? e.message : "Login fejlede");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Logger ind…" : "Log ind"}
              </Button>

              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                2FA (TOTP) kan aktiveres i Settings efter login.
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}

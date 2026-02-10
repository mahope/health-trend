"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader
          title="2-trinsbekræftelse"
          description="Indtast koden fra din authenticator-app."
        />
        <CardBody>
        <div className="space-y-3">
          <Input
            className="tracking-widest"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
            inputMode="numeric"
            autoComplete="one-time-code"
          />

          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
            />
            Husk denne enhed (30 dage)
          </label>

          {error && <div className="text-sm text-[color:var(--text-error)]">{error}</div>}

          <Button
            variant="primary"
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await authClient.twoFactor.verifyTotp({
                  code,
                  trustDevice,
                });
                if (res.error) {
                  setError(res.error.message || "Forkert kode");
                } else {
                  window.location.href = "/";
                }
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Verificering fejlede";
                setError(msg);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Verificerer…" : "Bekræft"}
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/login";
            }}
          >
            Log ud
          </Button>
        </div>
        </CardBody>
      </Card>
    </main>
  );
}

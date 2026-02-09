"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6">
        <h1 className="text-xl font-semibold">2-trinsbekræftelse</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Indtast koden fra din authenticator-app.
        </p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-md border px-3 py-2 tracking-widest"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
            inputMode="numeric"
            autoComplete="one-time-code"
          />

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
            />
            Husk denne enhed (30 dage)
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            className="w-full rounded-md bg-black text-white py-2 disabled:opacity-50"
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
          </button>

          <button
            className="w-full rounded-md border py-2"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/login";
            }}
          >
            Log ud
          </button>
        </div>
      </div>
    </main>
  );
}

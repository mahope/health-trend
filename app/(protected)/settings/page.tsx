"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SettingsPage() {
  const [password, setPassword] = useState("");
  const [issuer, setIssuer] = useState("Health Trend");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Her kan du slå 2FA (TOTP) til.
        </p>
      </div>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Aktivér 2FA (TOTP)</h2>

        <div className="grid gap-3 max-w-md">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Dit password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Issuer (navn i authenticator app)"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            className="rounded-md bg-black text-white py-2 disabled:opacity-50"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await authClient.twoFactor.enable({
                  password,
                  issuer,
                });
                if (res.error) {
                  setError(res.error.message);
                } else {
                  setTotpURI(res.data.totpURI);
                  setBackupCodes(res.data.backupCodes);
                }
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Kunne ikke aktivere 2FA");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Aktiverer…" : "Aktivér"}
          </button>
        </div>

        {totpURI && (
          <div className="mt-4 space-y-3">
            <div className="text-sm">
              1) Scan QR / brug TOTP URI (midlertidigt viser vi bare URI’en):
            </div>
            <pre className="text-xs whitespace-pre-wrap rounded-md bg-neutral-50 border p-3 overflow-auto">
              {totpURI}
            </pre>

            {backupCodes && (
              <div className="space-y-2">
                <div className="text-sm">2) Gem backup-koder (meget vigtigt):</div>
                <pre className="text-xs whitespace-pre-wrap rounded-md bg-neutral-50 border p-3">
                  {backupCodes.join("\n")}
                </pre>
              </div>
            )}

            <div className="grid gap-3 max-w-md">
              <input
                className="w-full rounded-md border px-3 py-2 tracking-widest"
                placeholder="TOTP kode (123456)"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\s/g, ""))}
                inputMode="numeric"
              />

              <button
                className="rounded-md border py-2 disabled:opacity-50"
                disabled={verifying}
                onClick={async () => {
                  setVerifying(true);
                  setError(null);
                  try {
                    const res = await authClient.twoFactor.verifyTotp({
                      code: verifyCode,
                      trustDevice: true,
                    });
                    if (res.error) {
                      setError(res.error.message);
                    } else {
                      // refresh
                      window.location.reload();
                    }
                  } catch (e: unknown) {
                    setError(e instanceof Error ? e.message : "Verificering fejlede");
                  } finally {
                    setVerifying(false);
                  }
                }}
              >
                {verifying ? "Verificerer…" : "Verificér og slå til"}
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Note: QR rendering kommer senere (vi kan generere QR på client eller via et lille endpoint).
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Log ud</h2>
        <button
          className="rounded-md border px-3 py-2"
          onClick={async () => {
            await authClient.signOut();
            window.location.href = "/login";
          }}
        >
          Log ud
        </button>
      </section>
    </div>
  );
}

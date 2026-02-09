"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { QrImage } from "@/components/QrImage";
import { authClient } from "@/lib/auth-client";

export default function SettingsPage() {
  const [password, setPassword] = useState("");
  const [issuer, setIssuer] = useState("Health Trend");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  const [stepsGoal, setStepsGoal] = useState("8000");
  const [sleepGoalHours, setSleepGoalHours] = useState("7.5");
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsSaving, setGoalsSaving] = useState(false);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const safeTotpURI = useMemo(() => totpURI?.trim() ?? null, [totpURI]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!safeTotpURI) {
        setQrDataUrl(null);
        return;
      }
      try {
        const url = await QRCode.toDataURL(safeTotpURI, {
          margin: 1,
          scale: 7,
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [safeTotpURI]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGoalsLoading(true);
      try {
        const res = await fetch("/api/profile/goals", { cache: "no-store" });
        const json = (await res.json()) as { profile?: { stepsGoal: number; sleepGoalHours: number } };
        if (res.ok && json.profile && !cancelled) {
          setStepsGoal(String(json.profile.stepsGoal));
          setSleepGoalHours(String(json.profile.sleepGoalHours));
        }
      } finally {
        if (!cancelled) setGoalsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Her kan du slå 2FA (TOTP) til.
        </p>
      </div>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Mål</h2>

        <div className="grid gap-3 max-w-md">
          <div>
            <div className="text-xs text-neutral-500">Dagligt step-mål</div>
            <input
              className="w-full rounded-md border px-3 py-2"
              inputMode="numeric"
              value={stepsGoal}
              onChange={(e) => setStepsGoal(e.target.value)}
              disabled={goalsLoading || goalsSaving}
            />
          </div>

          <div>
            <div className="text-xs text-neutral-500">Søvn-mål (timer pr. nat)</div>
            <input
              className="w-full rounded-md border px-3 py-2"
              inputMode="decimal"
              value={sleepGoalHours}
              onChange={(e) => setSleepGoalHours(e.target.value)}
              disabled={goalsLoading || goalsSaving}
            />
          </div>

          <button
            className="rounded-md bg-black text-white py-2 disabled:opacity-50"
            disabled={goalsLoading || goalsSaving}
            onClick={async () => {
              setGoalsSaving(true);
              try {
                const res = await fetch("/api/profile/goals", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    stepsGoal: Number(stepsGoal),
                    sleepGoalHours: Number(sleepGoalHours),
                  }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Kunne ikke gemme mål");
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Kunne ikke gemme mål");
              } finally {
                setGoalsSaving(false);
              }
            }}
          >
            {goalsSaving ? "Gemmer…" : "Gem"}
          </button>

          <div className="text-xs text-neutral-500">
            Bruges i streaks + søvngæld på “Indsigter”.
          </div>
        </div>
      </section>

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
                  setError(res.error.message || "Kunne ikke aktivere 2FA");
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

        {safeTotpURI && (
          <div className="mt-4 space-y-4">
            <div className="text-sm">
              1) Scan QR-koden med din authenticator-app:
            </div>

            {qrDataUrl ? (
              <QrImage dataUrl={qrDataUrl} />
            ) : (
              <div className="text-sm text-neutral-500">Kunne ikke generere QR.</div>
            )}

            <details className="rounded-md border p-3 bg-neutral-50">
              <summary className="text-sm cursor-pointer">Vis TOTP URI</summary>
              <pre className="text-xs whitespace-pre-wrap mt-2 overflow-auto">
                {safeTotpURI}
              </pre>
            </details>

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
                      setError(res.error.message || "Verificering fejlede");
                    } else {
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

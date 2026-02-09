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

  const [sex, setSex] = useState<"male" | "female">("male");
  const [pregnant, setPregnant] = useState(false);
  const [cycleDay, setCycleDay] = useState<string>("");
  const [lastPeriodStart, setLastPeriodStart] = useState<string>(""); // YYYY-MM-DD
  const [cycleLengthDays, setCycleLengthDays] = useState<string>("28");
  const [cycleSymptoms, setCycleSymptoms] = useState<string[]>([]);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextSaving, setContextSaving] = useState(false);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const safeTotpURI = useMemo(() => totpURI?.trim() ?? null, [totpURI]);

  const computedCycleDay = useMemo(() => {
    if (sex !== "female") return null;
    if (!lastPeriodStart) return null;
    const start = new Date(`${lastPeriodStart}T00:00:00.000Z`).getTime();
    if (Number.isNaN(start)) return null;
    const now = Date.now();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const len = Number(cycleLengthDays) || 28;
    const safeLen = Math.max(20, Math.min(45, Math.round(len)));
    return (diffDays % safeLen) + 1;
  }, [sex, lastPeriodStart, cycleLengthDays]);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setContextLoading(true);
      try {
        const res = await fetch("/api/profile/context", { cache: "no-store" });
        const json = (await res.json()) as {
          profile?: {
            sex: "male" | "female";
            pregnant: boolean;
            cycleDay: number | null;
            lastPeriodStart: string | null;
            cycleLengthDays: number | null;
            cycleSymptoms: unknown;
          };
        };
        if (res.ok && json.profile && !cancelled) {
          setSex(json.profile.sex);
          setPregnant(Boolean(json.profile.pregnant));
          setCycleDay(json.profile.cycleDay ? String(json.profile.cycleDay) : "");
          setLastPeriodStart(json.profile.lastPeriodStart ? json.profile.lastPeriodStart.slice(0, 10) : "");
          setCycleLengthDays(
            json.profile.cycleLengthDays ? String(json.profile.cycleLengthDays) : "28",
          );
          setCycleSymptoms(Array.isArray(json.profile.cycleSymptoms) ? (json.profile.cycleSymptoms as string[]) : []);
        }
      } finally {
        if (!cancelled) setContextLoading(false);
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
        <h2 className="font-semibold">Krop & kontekst</h2>
        <p className="text-sm text-neutral-500">
          Bruges til mere præcise indsigter (fx cyklus/menstruation).
        </p>

        <div className="grid gap-3 max-w-md">
          <label className="text-sm">
            <div className="text-xs text-neutral-500">Køn</div>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={sex}
              disabled={contextLoading || contextSaving}
              onChange={(e) => setSex(e.target.value === "female" ? "female" : "male")}
            >
              <option value="male">Mand</option>
              <option value="female">Kvinde</option>
            </select>
          </label>

          {sex === "female" ? (
            <>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pregnant}
                  disabled={contextLoading || contextSaving}
                  onChange={(e) => setPregnant(e.target.checked)}
                />
                Gravid
              </label>

              <label className="text-sm">
                <div className="text-xs text-neutral-500">Cyklusdag (valgfri)</div>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  inputMode="numeric"
                  placeholder="fx 12"
                  value={cycleDay}
                  disabled={contextLoading || contextSaving}
                  onChange={(e) => setCycleDay(e.target.value.replace(/\D/g, ""))}
                />
                <div className="mt-1 text-xs text-neutral-500">
                  1–40. Tom = ukendt.
                  {computedCycleDay ? ` (beregnet: dag ${computedCycleDay})` : ""}
                </div>
              </label>

              <label className="text-sm">
                <div className="text-xs text-neutral-500">Sidste menstruationsstart (valgfri)</div>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  type="date"
                  value={lastPeriodStart}
                  disabled={contextLoading || contextSaving}
                  onChange={(e) => setLastPeriodStart(e.target.value)}
                />
              </label>

              <label className="text-sm">
                <div className="text-xs text-neutral-500">Cykellængde (dage, estimat)</div>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  inputMode="numeric"
                  placeholder="fx 28"
                  value={cycleLengthDays}
                  disabled={contextLoading || contextSaving}
                  onChange={(e) => setCycleLengthDays(e.target.value.replace(/\D/g, ""))}
                />
                <div className="mt-1 text-xs text-neutral-500">20–45. Bruges til beregning hvis cyklusdag er tom.</div>
              </label>

              <div className="space-y-2">
                <div className="text-xs text-neutral-500">Typiske symptomer (valgfri)</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["cramps", "Kramper"],
                    ["headache", "Hovedpine"],
                    ["bloating", "Oppustet"],
                    ["breastTenderness", "Ømme bryster"],
                    ["acne", "Akne"],
                    ["mood", "Humør"],
                    ["fatigue", "Træthed"],
                  ].map(([key, label]) => (
                    <label key={key} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={cycleSymptoms.includes(key)}
                        disabled={contextLoading || contextSaving}
                        onChange={(e) => {
                          setCycleSymptoms((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(key);
                            else next.delete(key);
                            return Array.from(next);
                          });
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <button
            className="rounded-md bg-black text-white py-2 disabled:opacity-50"
            disabled={contextLoading || contextSaving}
            onClick={async () => {
              setContextSaving(true);
              setError(null);
              try {
                const res = await fetch("/api/profile/context", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    sex,
                    pregnant,
                    cycleDay: sex === "female" && cycleDay ? Number(cycleDay) : null,
                    lastPeriodStart: sex === "female" && lastPeriodStart ? lastPeriodStart : null,
                    cycleLengthDays:
                      sex === "female" && cycleLengthDays ? Number(cycleLengthDays) : null,
                    cycleSymptoms: sex === "female" ? cycleSymptoms : [],
                  }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Kunne ikke gemme");
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Kunne ikke gemme");
              } finally {
                setContextSaving(false);
              }
            }}
          >
            {contextSaving ? "Gemmer…" : "Gem"}
          </button>
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

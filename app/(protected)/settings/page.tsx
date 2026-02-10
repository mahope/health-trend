"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { QrImage } from "@/components/QrImage";
import { authClient } from "@/lib/auth-client";
import { useRateLimitedToast } from "@/hooks/useRateLimitedToast";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function SettingsPage() {
  const { rateLimitedToast } = useRateLimitedToast(1200);

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

      <Card>
        <CardHeader title="Mål" description="Bruges i streaks + søvngæld på &quot;Indsigter&quot;." />
        <CardBody>
        <div className="grid gap-3 max-w-md">
          <FormField label="Dagligt step-mål">
            <Input
              inputMode="numeric"
              value={stepsGoal}
              onChange={(e) => setStepsGoal(e.target.value)}
              disabled={goalsLoading || goalsSaving}
            />
          </FormField>

          <FormField label="Søvn-mål (timer pr. nat)">
            <Input
              inputMode="decimal"
              value={sleepGoalHours}
              onChange={(e) => setSleepGoalHours(e.target.value)}
              disabled={goalsLoading || goalsSaving}
            />
          </FormField>

          <Button
            variant="primary"
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
                rateLimitedToast({ title: "Mål gemt ✓", kind: "success", vibrateMs: 10 });
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Kunne ikke gemme mål");
                rateLimitedToast({
                  title: e instanceof Error ? e.message : "Kunne ikke gemme mål",
                  kind: "error",
                  vibrateMs: 35,
                });
              } finally {
                setGoalsSaving(false);
              }
            }}
          >
            {goalsSaving ? "Gemmer…" : "Gem"}
          </Button>
        </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Krop & kontekst" description="Bruges til mere præcise indsigter (fx cyklus/menstruation)." />
        <CardBody>
        <div className="grid gap-3 max-w-md">
          <FormField label="Køn">
            <Select
              value={sex}
              disabled={contextLoading || contextSaving}
              onChange={(e) => setSex(e.target.value === "female" ? "female" : "male")}
            >
              <option value="male">Mand</option>
              <option value="female">Kvinde</option>
            </Select>
          </FormField>

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

              <FormField label="Cyklusdag (valgfri)" description={`1–40. Tom = ukendt.${computedCycleDay ? ` (beregnet: dag ${computedCycleDay})` : ""}`}>
                <Input
                  inputMode="numeric"
                  placeholder="fx 12"
                  value={cycleDay}
                  disabled={contextLoading || contextSaving}
                  onChange={(e) => setCycleDay(e.target.value.replace(/\D/g, ""))}
                />
              </FormField>

              <FormField label="Sidste menstruationsstart (valgfri)">
                <Input
                  type="date"
                  value={lastPeriodStart}
                  disabled={contextLoading || contextSaving}
                  onChange={(e) => setLastPeriodStart(e.target.value)}
                />
              </FormField>

              <FormField label="Cykellængde (dage, estimat)" description="20–45. Bruges til beregning hvis cyklusdag er tom.">
                <Input
                  inputMode="numeric"
                  placeholder="fx 28"
                  value={cycleLengthDays}
                  disabled={contextLoading || contextSaving}
                  onChange={(e) => setCycleLengthDays(e.target.value.replace(/\D/g, ""))}
                />
              </FormField>

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

          <Button
            variant="primary"
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
                rateLimitedToast({ title: "Kontekst gemt ✓", kind: "success", vibrateMs: 10 });
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Kunne ikke gemme");
                rateLimitedToast({
                  title: e instanceof Error ? e.message : "Kunne ikke gemme",
                  kind: "error",
                  vibrateMs: 35,
                });
              } finally {
                setContextSaving(false);
              }
            }}
          >
            {contextSaving ? "Gemmer…" : "Gem"}
          </Button>
        </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Aktivér 2FA (TOTP)" />
        <CardBody>
        <div className="grid gap-3 max-w-md">
          <Input
            placeholder="Dit password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            placeholder="Issuer (navn i authenticator app)"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
          />

          {error && <div className="text-sm text-[color:var(--text-error)]">{error}</div>}

          <Button
            variant="primary"
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
                  rateLimitedToast({
                    title: "2FA klargjort - scan QR",
                    kind: "success",
                    vibrateMs: 12,
                  });
                }
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Kunne ikke aktivere 2FA");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Aktiverer…" : "Aktivér"}
          </Button>
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
              <Input
                className="tracking-widest"
                placeholder="TOTP kode (123456)"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\s/g, ""))}
                inputMode="numeric"
              />

              <Button
                variant="secondary"
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
                      rateLimitedToast({ title: "2FA aktiveret ✓", kind: "success", vibrateMs: 15 });
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
              </Button>
            </div>
          </div>
        )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Om appen" description="Praktisk hvis du rapporterer bugs eller tester deploys." />
        <CardBody>
        <div className="text-sm text-[color:var(--text-tertiary)]">
          Version {process.env.NEXT_PUBLIC_APP_VERSION} ({process.env.NEXT_PUBLIC_GIT_SHA})
        </div>
        <Button
          variant="secondary"
          className="mt-3"
          onClick={async () => {
            const text = `Health Trend v${process.env.NEXT_PUBLIC_APP_VERSION} (${process.env.NEXT_PUBLIC_GIT_SHA})`;
            try {
              await navigator.clipboard.writeText(text);
              rateLimitedToast({ title: "Build-info kopieret", kind: "success", vibrateMs: 8 });
            } catch {
              rateLimitedToast({ title: "Kunne ikke kopiere", kind: "error", vibrateMs: 25 });
            }
          }}
        >
          Kopiér build-info
        </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Log ud" />
        <CardBody>
        <Button
          variant="secondary"
          onClick={async () => {
            await authClient.signOut();
            window.location.href = "/login";
          }}
        >
          Log ud
        </Button>
        </CardBody>
      </Card>
    </div>
  );
}

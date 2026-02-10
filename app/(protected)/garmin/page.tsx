"use client";

import { useEffect, useState } from "react";
import { EmptyState, InlineEmptyLink } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/date";

type Status =
  | { connected: false }
  | { connected: true; tokensUpdatedAt: string; status: string; lastError?: string | null };

export default function GarminPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string } | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    setFieldError(null);
    try {
      const res = await fetch("/api/garmin/status");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Kunne ikke hente status");
      setStatus(json.status);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Garmin</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Primært flow: log ind med Garmin her, så henter app’en automatisk derfra.
          (Vi kan stadig importere lokale tokens som fallback.)
        </p>
      </div>

      <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4 space-y-3">
        <h2 className="font-semibold">Status</h2>

        {status ? (
          status.connected ? (
            <div className="text-sm text-[color:var(--text-secondary)]">
              Connected. Sidst opdateret: {formatDateTime(status.tokensUpdatedAt)} ({status.status})
              {status.lastError ? (
                <div className="mt-1 text-xs text-[color:var(--text-error)]">Sidste fejl: {status.lastError}</div>
              ) : null}
              <div className="mt-2 text-xs text-[color:var(--text-caption)]">
                Næste step: gå til <InlineEmptyLink href="/snapshots">Snapshots</InlineEmptyLink> og tag dit første snapshot.
              </div>
            </div>
          ) : (
            <EmptyState
              title="Ikke connected endnu"
              description={
                <>
                  For at kunne tage dit første snapshot skal serveren kunne hente Garmin-data.
                  <div className="mt-2 text-xs text-[color:var(--text-caption)]">
                    Tip: hvis du allerede har tokens lokalt, kan du importere dem herunder.
                  </div>
                </>
              }
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <LinkButton href="#connect" variant="primary">
                    Importér tokens
                  </LinkButton>
                  <LinkButton href="/snapshots" variant="secondary">
                    Åbn Snapshots
                  </LinkButton>
                </div>
              }
            />
          )
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        )}

        {error && <div className="text-sm text-[color:var(--text-error)]">{error}</div>}

        <div className="flex gap-2">
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            {loading ? "Henter…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4 space-y-3">
          <h2 className="font-semibold">Connect (Garmin login)</h2>
          <p className="text-sm text-[color:var(--text-caption)]">
            Indtast dit Garmin login her. Vi gemmer <b>ikke</b> dit password — kun tokens (krypteret).
            <span className="block mt-1">
              Når du er connected, kan du gå til <InlineEmptyLink href="/snapshots">Snapshots</InlineEmptyLink> og tage dit første snapshot.
            </span>
          </p>

          <div className="grid gap-2 max-w-md">
            <div>
              <Input
                placeholder="Garmin email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldError(null);
                }}
                autoComplete="username"
              />
              {fieldError?.email ? <div className="mt-1 text-xs text-[color:var(--text-error)]">{fieldError.email}</div> : null}
            </div>

            <div>
              <Input
                placeholder="Garmin password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldError(null);
                }}
                autoComplete="current-password"
              />
              {fieldError?.password ? (
                <div className="mt-1 text-xs text-[color:var(--text-error)]">{fieldError.password}</div>
              ) : null}
            </div>

            <Button
              variant="primary"
              disabled={loggingIn || (cooldownUntil ? Date.now() < cooldownUntil : false)}
              onClick={async () => {
                setLoggingIn(true);
                setError(null);
                setFieldError(null);
                try {
                  const res = await fetch("/api/garmin/login", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ email, password }),
                  });
                  const json = await res.json().catch(() => ({}));

                  if (!res.ok) {
                    if (res.status === 401) {
                      setFieldError({ password: "Forkert email eller password." });
                      return;
                    }
                    if (res.status === 429) {
                      const until = Date.now() + 30_000;
                      setCooldownUntil(until);
                      setError("For mange forsøg. Vent 30 sek og prøv igen.");
                      return;
                    }

                    const msg =
                      (json?.message as string | undefined) ||
                      (json?.error as string | undefined) ||
                      "Login fejlede";
                    throw new Error(msg);
                  }

                  setPassword("");
                  await refresh();
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : "Fejl";
                  setError(msg);
                } finally {
                  setLoggingIn(false);
                }
              }}
            >
              {loggingIn ? "Logger ind…" : cooldownUntil && Date.now() < cooldownUntil ? "Vent lidt…" : "Login og connect"}
            </Button>

            <div className="text-xs text-[color:var(--text-caption)]">
              Hvis login fejler pga. forkert password, viser vi en pæn fejl (401).
              <span className="block mt-1">
                Note: I prod kører dette via Python i Docker-image (repo-contained script). Lokalt kræver det at <code>python3</code> findes i PATH, eller at du sætter <code>HEALTH_TREND_PYTHON</code>.
              </span>
            </div>
          </div>
        </div>

        <div id="connect" className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4 space-y-3">
          <h2 className="font-semibold">Fallback: import local tokens</h2>
          <p className="text-sm text-[color:var(--text-caption)]">
            Dette læser lokale Garmin tokens fra serveren og gemmer dem krypteret.
          </p>

          <Button
            variant="secondary"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await fetch("/api/garmin/connect", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ mode: "import_local" }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Connect fejlede");
                await refresh();
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Fejl");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Arbejder…" : "Importér tokens"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">Kryptering</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Tokens gemmes krypteret med ENCRYPTION_KEY (AES-256-GCM). Hvis DB ikke kører, gemmer vi i <code>.local-data</code>.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, InlineEmptyLink } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";

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

  async function refresh() {
    setLoading(true);
    setError(null);
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
            <div className="text-sm text-neutral-700 dark:text-neutral-200">
              Connected. Sidst opdateret: {new Date(status.tokensUpdatedAt).toLocaleString("da-DK", { hour12: false })} ({status.status})
              {status.lastError ? (
                <div className="mt-1 text-xs text-rose-700 dark:text-rose-300">Sidste fejl: {status.lastError}</div>
              ) : null}
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Næste step: gå til <InlineEmptyLink href="/snapshots">Snapshots</InlineEmptyLink> og tag dit første snapshot.
              </div>
            </div>
          ) : (
            <EmptyState
              title="Ikke connected endnu"
              description={
                <>
                  For at kunne tage dit første snapshot skal serveren kunne hente Garmin-data.
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Tip: hvis du allerede har tokens lokalt, kan du importere dem herunder.
                  </div>
                </>
              }
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="#connect"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus-visible:ring-white/20"
                  >
                    Importér tokens
                  </Link>
                  <Link
                    href="/snapshots"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/10 dark:bg-black/30 dark:text-neutral-100 dark:hover:bg-black/45 dark:focus-visible:ring-white/20"
                  >
                    Åbn Snapshots
                  </Link>
                </div>
              }
            />
          )
        ) : (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Henter…</div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex gap-2">
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            {loading ? "Henter…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4 space-y-3">
          <h2 className="font-semibold">Connect (Garmin login)</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Indtast dit Garmin login her. Vi gemmer <b>ikke</b> dit password — kun tokens (krypteret).
            <span className="block mt-1">
              Når du er connected, kan du gå til <InlineEmptyLink href="/snapshots">Snapshots</InlineEmptyLink> og tage dit første snapshot.
            </span>
          </p>

          <div className="grid gap-2 max-w-md">
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Garmin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Garmin password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <Button
              variant="primary"
              disabled={loggingIn}
              onClick={async () => {
                setLoggingIn(true);
                setError(null);
                try {
                  const res = await fetch("/api/garmin/login", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ email, password }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(json?.error || "Login fejlede");
                  setPassword("");
                  await refresh();
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : "Fejl");
                } finally {
                  setLoggingIn(false);
                }
              }}
            >
              {loggingIn ? "Logger ind…" : "Login og connect"}
            </Button>

            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Note: På din laptop kører dette via et lokalt Python-helper script (samme setup som din Garmin pipeline).
            </div>
          </div>
        </div>

        <div id="connect" className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4 space-y-3">
          <h2 className="font-semibold">Fallback: import local tokens</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Dette læser fra <code>C:/Users/mads_/Garmin/tokens/oauth1_token.json</code> + <code>oauth2_token.json</code> på serveren og gemmer krypteret.
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

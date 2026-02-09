"use client";

import { useEffect, useState } from "react";

type Status =
  | { connected: false }
  | { connected: true; tokensUpdatedAt: string; status: string; lastError?: string | null };

export default function GarminPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Token-only. Vi kan importere dine eksisterende tokens (fra din Garmin-pipeline) uden login.
        </p>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Status</h2>
        {status ? (
          status.connected ? (
            <div className="text-sm text-neutral-700">
              Connected. Sidst opdateret: {new Date(status.tokensUpdatedAt).toLocaleString("da-DK")} ({status.status})
            </div>
          ) : (
            <div className="text-sm text-neutral-500">Ikke connected endnu.</div>
          )
        ) : (
          <div className="text-sm text-neutral-500">Henter…</div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2" onClick={refresh} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Connect (import local)</h2>
        <p className="text-sm text-neutral-500">
          Dette læser fra <code>C:/Users/mads_/Garmin/tokens/oauth1_token.json</code> + <code>oauth2_token.json</code> på serveren og gemmer krypteret.
        </p>

        <button
          className="rounded-md bg-black text-white px-3 py-2 disabled:opacity-50"
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
        </button>
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

"use client";

import { useEffect, useMemo, useState } from "react";

type Snapshot = {
  id: string;
  day: string;
  takenAt: string;
  steps?: number | null;
  restingHr?: number | null;
  stressAvg?: number | null;
  sleepHours?: number | null;
  bodyBatteryHigh?: number | null;
  bodyBatteryLow?: number | null;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function todayCphClient(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function SnapshotsPage() {
  const [day, setDay] = useState(todayCphClient());
  const [items, setItems] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/snapshots/list?day=${encodeURIComponent(day)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Kunne ikke hente snapshots");
      setItems(json.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  const deltas = useMemo(() => {
    if (items.length < 2) return [] as Array<{ a: Snapshot; b: Snapshot; dSteps?: number | null }>;
    const out: Array<{ a: Snapshot; b: Snapshot; dSteps?: number | null }> = [];
    for (let i = 1; i < items.length; i++) {
      const a = items[i - 1];
      const b = items[i];
      out.push({
        a,
        b,
        dSteps:
          a.steps != null && b.steps != null ? (b.steps as number) - (a.steps as number) : null,
      });
    }
    return out;
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Snapshots</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Tag snapshots (morgen/middag/aften) og se udvikling.
        </p>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-neutral-500">Dag</label>
            <input
              className="rounded-md border px-3 py-2"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <button
            className="rounded-md bg-black text-white px-3 py-2 disabled:opacity-50"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await fetch("/api/snapshots/take", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ day }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Kunne ikke tage snapshot");
                await refresh();
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Fejl");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Arbejder…" : "Tag snapshot"}
          </button>

          <button className="rounded-md border px-3 py-2" onClick={refresh}>
            Refresh
          </button>
        </div>

        <p className="text-xs text-neutral-500">
          Snapshot læses lokalt fra <code>C:/Users/mads_/Garmin/data/garmin-YYYY-MM-DD.json</code>
          (via server route) og gemmes i DB hvis tilgængelig, ellers i <code>.local-data</code>.
        </p>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">Liste</h2>
          <div className="mt-3 space-y-2">
            {items.length === 0 ? (
              <div className="text-sm text-neutral-500">Ingen snapshots endnu.</div>
            ) : (
              items.map((x) => (
                <div key={x.id} className="text-sm flex items-center justify-between">
                  <div>{fmtTime(x.takenAt)}</div>
                  <div className="text-neutral-600">Steps: {x.steps ?? "-"}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">Delta</h2>
          <div className="mt-3 space-y-2">
            {deltas.length === 0 ? (
              <div className="text-sm text-neutral-500">Tag mindst 2 snapshots.</div>
            ) : (
              deltas.map((d) => (
                <div key={d.b.id} className="text-sm flex items-center justify-between">
                  <div>
                    {fmtTime(d.a.takenAt)} → {fmtTime(d.b.takenAt)}
                  </div>
                  <div className="text-neutral-600">
                    Δ steps: {d.dSteps ?? "-"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

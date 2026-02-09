"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays } from "@/lib/date";
import { Button } from "@/components/ui/Button";

type Snapshot = {
  id: string;
  day: string;
  takenAt: string;
  steps?: number | null;
  restingHr?: number | null;
  stressAvg?: number | null;
  sleepHours?: number | null;
  sleepMinutes?: number | null;
  bodyBatteryHigh?: number | null;
  bodyBatteryLow?: number | null;
  spo2Avg?: number | null;
  respAvgSleep?: number | null;
};

function fmtDelta(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  if (n === 0) return "±0";
  return n > 0 ? `+${n}` : `${n}`;
}

function delta(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a === null || a === undefined) return null;
  if (b === null || b === undefined) return null;
  return a - b;
}

function pickLatest(snaps: Snapshot[]): Snapshot | null {
  if (!snaps.length) return null;
  return snaps
    .slice()
    .sort((x, y) => new Date(y.takenAt).getTime() - new Date(x.takenAt).getTime())[0] ?? null;
}

function pickPrev(snaps: Snapshot[], latest: Snapshot): Snapshot | null {
  const sorted = snaps
    .slice()
    .sort((x, y) => new Date(y.takenAt).getTime() - new Date(x.takenAt).getTime());
  const idx = sorted.findIndex((s) => s.id === latest.id);
  if (idx === -1) return null;
  return sorted[idx + 1] ?? null;
}

export function LatestSnapshotCard({ day }: { day: string }) {
  const [snapsToday, setSnapsToday] = useState<Snapshot[] | null>(null);
  const [snapsYesterday, setSnapsYesterday] = useState<Snapshot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yday = useMemo(() => addDays(day, -1), [day]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [a, b] = await Promise.all([
          fetch(`/api/snapshots/list?day=${encodeURIComponent(day)}`, { cache: "no-store" }),
          fetch(`/api/snapshots/list?day=${encodeURIComponent(yday)}`, { cache: "no-store" }),
        ]);

        const aJson = (await a.json()) as { snapshots?: Snapshot[]; error?: string };
        const bJson = (await b.json()) as { snapshots?: Snapshot[]; error?: string };

        if (!a.ok) throw new Error(aJson.error || `Kunne ikke hente snapshots for ${day}`);
        if (!b.ok) throw new Error(bJson.error || `Kunne ikke hente snapshots for ${yday}`);

        if (!cancelled) {
          setSnapsToday(aJson.snapshots ?? []);
          setSnapsYesterday(bJson.snapshots ?? []);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ukendt fejl");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [day, yday]);

  const { latest, prev } = useMemo(() => {
    const all = [...(snapsToday ?? []), ...(snapsYesterday ?? [])];
    const latest = pickLatest(all);
    const prev = latest ? pickPrev(all, latest) : null;
    return { latest, prev };
  }, [snapsToday, snapsYesterday]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Seneste snapshot</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            {latest
              ? new Date(latest.takenAt).toLocaleString("da-DK", { hour12: false })
              : "Ingen endnu"}
          </div>
        </div>

        <Button
          size="sm"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const res = await fetch("/api/snapshots/take", { method: "POST" });
              const json = (await res.json()) as { ok?: boolean; error?: string };
              if (!res.ok) throw new Error(json.error || "Kunne ikke tage snapshot");

              // Re-fetch
              const [a, b] = await Promise.all([
                fetch(`/api/snapshots/list?day=${encodeURIComponent(day)}`, {
                  cache: "no-store",
                }),
                fetch(`/api/snapshots/list?day=${encodeURIComponent(yday)}`, {
                  cache: "no-store",
                }),
              ]);
              const aJson = (await a.json()) as { snapshots?: Snapshot[] };
              const bJson = (await b.json()) as { snapshots?: Snapshot[] };
              setSnapsToday(aJson.snapshots ?? []);
              setSnapsYesterday(bJson.snapshots ?? []);
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "Kunne ikke tage snapshot");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Arbejder…" : "Tag snapshot"}
        </Button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {!latest && !loading && (
        <div className="text-sm text-neutral-500">
          Tip: Klik “Tag snapshot” (den læser din lokale `garmin-YYYY-MM-DD.json`).
        </div>
      )}

      {latest && (
        <div className="grid gap-2 text-sm">
          <Row label="Steps" value={latest.steps} delta={fmtDelta(delta(latest.steps, prev?.steps))} />
          <Row label="Resting HR" value={latest.restingHr} delta={fmtDelta(delta(latest.restingHr, prev?.restingHr))} />
          <Row label="Stress (avg)" value={latest.stressAvg} delta={fmtDelta(delta(latest.stressAvg, prev?.stressAvg))} />
          <Row label="Sleep (timer)" value={latest.sleepHours ?? (latest.sleepMinutes ? latest.sleepMinutes / 60 : null)} delta={fmtDelta(delta(latest.sleepHours ?? null, prev?.sleepHours ?? null))} />
          <Row label="Body Battery (H/L)" value={formatBB(latest.bodyBatteryHigh, latest.bodyBatteryLow)} delta={formatBBDelta(prev, latest)} />
          <Row label="SpO2 (avg)" value={latest.spo2Avg} delta={fmtDelta(delta(latest.spo2Avg, prev?.spo2Avg))} />
          <Row label="Resp (sleep)" value={latest.respAvgSleep} delta={fmtDelta(delta(latest.respAvgSleep, prev?.respAvgSleep))} />

          {prev && (
            <div className="pt-2 text-xs text-neutral-500">
              Delta er ift. forrige snapshot ({new Date(prev.takenAt).toLocaleString("da-DK", { hour12: false })}).
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  delta,
}: {
  label: string;
  value: number | string | null | undefined;
  delta?: string;
}) {
  const hasValue = !(value === null || value === undefined || value === "");
  return (
    <div className="flex items-center justify-between gap-3 border-b last:border-b-0 pb-2 last:pb-0">
      <div className="text-neutral-600">{label}</div>
      <div className="flex items-center gap-2">
        <div className={hasValue ? "font-medium" : "text-neutral-400"}>{hasValue ? value : "—"}</div>
        {delta && hasValue && <div className="text-xs text-neutral-500">({delta})</div>}
      </div>
    </div>
  );
}

function formatBB(high?: number | null, low?: number | null): string {
  const h = high ?? null;
  const l = low ?? null;
  if (h === null && l === null) return "—";
  if (h === null) return `—/${l}`;
  if (l === null) return `${h}/—`;
  return `${h}/${l}`;
}

function formatBBDelta(prev: Snapshot | null, latest: Snapshot): string {
  if (!prev) return "";
  const dH = delta(latest.bodyBatteryHigh, prev.bodyBatteryHigh);
  const dL = delta(latest.bodyBatteryLow, prev.bodyBatteryLow);
  const parts: string[] = [];
  if (dH !== null) parts.push(`H ${fmtDelta(dH)}`);
  if (dL !== null) parts.push(`L ${fmtDelta(dL)}`);
  return parts.length ? `(${parts.join(", ")})` : "";
}

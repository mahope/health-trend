"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDaysYmd } from "@/lib/date";
import { Button } from "@/components/ui/Button";
import { MetricGrid, MetricTile } from "@/components/MetricGrid";
import { EmptyState, InlineEmptyLink } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { fmtDelta, fmtDeltaFloat, fmtFloat, fmtNumber } from "@/lib/format";

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

type TakeSnapshotError = {
  code?: string;
  message: string;
  file?: string;
  hint?: string;
};

export function LatestSnapshotCard({ day }: { day: string }) {
  const [snapsToday, setSnapsToday] = useState<Snapshot[] | null>(null);
  const [snapsYesterday, setSnapsYesterday] = useState<Snapshot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TakeSnapshotError | null>(null);

  const yday = useMemo(() => addDaysYmd(day, -1), [day]);

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
        if (!cancelled)
          setError({ message: e instanceof Error ? e.message : "Ukendt fejl" });
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

  const takeSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snapshots/take", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        file?: string;
        hint?: string;
      };

      if (!res.ok) {
        if (json?.error === "missing_garmin_file") {
          setError({
            code: json.error,
            message: "Mangler Garmin-fil til i dag.",
            file: json.file,
            hint: json.hint,
          });
          return;
        }
        setError({ message: json?.error || "Kunne ikke tage snapshot" });
        return;
      }

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
      setError({ message: e instanceof Error ? e.message : "Kunne ikke tage snapshot" });
    } finally {
      setLoading(false);
    }
  };

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

        <Button size="sm" disabled={loading} onClick={takeSnapshot}>
          {loading ? "Arbejder…" : "Tag snapshot"}
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-50/60 p-4 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-200">
          <div className="font-medium">{error.message}</div>
          {(error.hint || error.file) && (
            <div className="mt-1 text-xs text-red-700/90 dark:text-red-200/80">
              {error.hint ? <div>{error.hint}</div> : null}
              {error.file ? (
                <div>
                  Fil: <code className="break-all">{error.file}</code>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {loading && !latest && (snapsToday === null || snapsYesterday === null) ? (
        <div className="space-y-3">
          <MetricGrid className="sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20"
              >
                <Skeleton className="h-3 w-16" />
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </MetricGrid>
          <Skeleton className="h-3 w-64" />
        </div>
      ) : !latest && !loading ? (
        <EmptyState
          title="Ingen snapshots endnu"
          description={
            <>
              For at komme i gang skal der ligge en Garmin eksport for i dag (fx{" "}
              <code>garmin-YYYY-MM-DD.json</code>). Når du har taget det første snapshot, kan du begynde at se trends og få AI-brief.
            </>
          }
          actions={
            <div className="grid gap-2">
              <Button variant="primary" disabled={loading} onClick={takeSnapshot}>
                {loading ? "Arbejder…" : "Tag første snapshot"}
              </Button>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Hvis den fejler, får du en sti/hint herover. Se også: <InlineEmptyLink href="/garmin">Garmin</InlineEmptyLink>
              </div>
              <Link
                href="/snapshots"
                className="text-xs text-neutral-500 underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-700 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:decoration-neutral-300"
              >
                Åbn Snapshots-siden
              </Link>
            </div>
          }
        />
      ) : null}

      {latest && (
        <div className="space-y-3">
          <MetricGrid className="sm:grid-cols-3">
            <MetricTile
              label="Steps"
              value={fmtNumber(latest.steps)}
              delta={fmtDelta(delta(latest.steps, prev?.steps))}
            />
            <MetricTile
              label="Resting HR"
              value={fmtNumber(latest.restingHr, " bpm")}
              delta={fmtDelta(delta(latest.restingHr, prev?.restingHr), " bpm")}
            />
            <MetricTile
              label="Stress (avg)"
              value={fmtNumber(latest.stressAvg)}
              delta={fmtDelta(delta(latest.stressAvg, prev?.stressAvg))}
            />
            <MetricTile
              label="Sleep"
              value={fmtFloat(latest.sleepHours ?? (latest.sleepMinutes ? latest.sleepMinutes / 60 : null), 1, " h")}
              delta={fmtDeltaFloat(delta(latest.sleepHours ?? null, prev?.sleepHours ?? null), 1, " h")}
            />
            <MetricTile
              label="Body Battery (H/L)"
              value={formatBB(latest.bodyBatteryHigh, latest.bodyBatteryLow)}
              delta={formatBBDelta(prev, latest)}
            />
            <MetricTile
              label="SpO2 (avg)"
              value={fmtFloat(latest.spo2Avg, 1, " %")}
              delta={fmtDeltaFloat(delta(latest.spo2Avg, prev?.spo2Avg), 1, " %")}
            />
            <MetricTile
              label="Resp (sleep)"
              value={fmtFloat(latest.respAvgSleep, 1)}
              delta={fmtDeltaFloat(delta(latest.respAvgSleep, prev?.respAvgSleep), 1)}
            />
          </MetricGrid>

          {prev && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Delta er ift. forrige snapshot ({new Date(prev.takenAt).toLocaleString("da-DK", { hour12: false })}).
            </div>
          )}
        </div>
      )}
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
  return parts.length ? parts.join(" · ") : "";
}

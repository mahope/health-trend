"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDaysYmd } from "@/lib/date";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";

type Snapshot = {
  id: string;
  day: string;
  takenAt: string;
  stressAvg?: number | null;
  sleepHours?: number | null;
  sleepMinutes?: number | null;
  bodyBatteryLow?: number | null;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function pickLatest(snaps: Snapshot[]): Snapshot | null {
  if (!snaps.length) return null;
  return (
    snaps
      .slice()
      .sort((x, y) => new Date(y.takenAt).getTime() - new Date(x.takenAt).getTime())[0] ?? null
  );
}

function fmtScoreTone(score: number): "ok" | "low" | "med" {
  if (score >= 75) return "ok";
  if (score >= 55) return "low";
  return "med";
}

export function RecoveryScoreCard({ day }: { day: string }) {
  const [snapsToday, setSnapsToday] = useState<Snapshot[] | null>(null);
  const [snapsYesterday, setSnapsYesterday] = useState<Snapshot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (!cancelled) setError(e instanceof Error ? e.message : "Ukendt fejl");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [day, yday]);

  const latest = useMemo(() => {
    const all = [...(snapsToday ?? []), ...(snapsYesterday ?? [])];
    return pickLatest(all);
  }, [snapsToday, snapsYesterday]);

  const computed = useMemo(() => {
    if (!latest) return null;

    const sleep = latest.sleepHours ?? (latest.sleepMinutes ? latest.sleepMinutes / 60 : null);
    const bbLow = latest.bodyBatteryLow ?? null;
    const stress = latest.stressAvg ?? null;

    // Heuristic score (0-100): quick guidance, not medical.
    const bbNorm = bbLow === null ? null : clamp01((bbLow - 5) / 45);
    const sleepNorm = sleep === null ? null : clamp01((sleep - 5) / 3);
    const stressInvNorm = stress === null ? null : 1 - clamp01((stress - 15) / 35);

    // Only compute if we have at least 2 signals.
    const parts = [bbNorm, sleepNorm, stressInvNorm].filter((x): x is number => typeof x === "number");
    if (parts.length < 2) return { score: null as number | null, bbLow, sleep, stress };

    const wBB = bbNorm === null ? 0 : 0.45;
    const wSleep = sleepNorm === null ? 0 : 0.35;
    const wStress = stressInvNorm === null ? 0 : 0.2;
    const wSum = wBB + wSleep + wStress;

    const score = Math.round(
      100 *
        ((bbNorm ?? 0) * wBB +
          (sleepNorm ?? 0) * wSleep +
          (stressInvNorm ?? 0) * wStress) /
        (wSum || 1),
    );

    return { score, bbLow, sleep, stress };
  }, [latest]);

  return (
    <Card>
      <CardHeader
        title="Recovery"
        description="Hurtig score (BB low + søvn + stress)."
        right={
          computed?.score != null ? (
            <Badge tone={fmtScoreTone(computed.score)}>{computed.score}/100</Badge>
          ) : (
            <Badge tone="neutral">—</Badge>
          )
        }
      />
      <CardBody>
        {error ? (
          <div className="text-sm text-red-700 dark:text-red-200">{error}</div>
        ) : !latest && !loading ? (
          <EmptyState
            title="Ingen snapshots endnu"
            description={
              <>
                Tag et snapshot først — så kan vi beregne en enkel recovery-score ud fra dine Garmin-signaler.
              </>
            }
            actions={
              <Link
                href="/snapshots"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus-visible:ring-white/20"
              >
                Åbn Snapshots
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-neutral-800 dark:text-neutral-100">
              {computed?.score != null
                ? "Jo højere, jo bedre. Brug den som pejling (ikke facit)."
                : "Ikke nok data endnu — tag gerne 1–2 snapshots mere i dag."}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-black/10 bg-white p-2 text-neutral-700 dark:border-white/10 dark:bg-black/30 dark:text-neutral-200">
                <div className="text-neutral-500 dark:text-neutral-400">BB low</div>
                <div className="font-medium">{computed?.bbLow ?? "—"}</div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-2 text-neutral-700 dark:border-white/10 dark:bg-black/30 dark:text-neutral-200">
                <div className="text-neutral-500 dark:text-neutral-400">Søvn</div>
                <div className="font-medium">
                  {computed?.sleep != null ? `${computed.sleep.toFixed(1)} h` : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-2 text-neutral-700 dark:border-white/10 dark:bg-black/30 dark:text-neutral-200">
                <div className="text-neutral-500 dark:text-neutral-400">Stress</div>
                <div className="font-medium">{computed?.stress ?? "—"}</div>
              </div>
            </div>

            {latest ? (
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Baseret på seneste snapshot ({new Date(latest.takenAt).toLocaleString("da-DK", {
                  hour12: false,
                })}).
              </div>
            ) : null}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

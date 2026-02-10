"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Sparkline } from "@/components/Sparkline";

type Insights = {
  sleepDebt: { debtHours: number; avgSleepHours?: number; goalHours?: number };
  streaks: { stepsStreak: number; sleepStreak: number; stepsGoal: number; sleepGoalHours: number };
};

type SleepDebtTrend = { series: Array<{ day: string; debtHours: number }> };

export function InsightsCards() {
  const [data, setData] = useState<Insights | null>(null);
  const [trend, setTrend] = useState<SleepDebtTrend | null>(null);
  const [windowDays, setWindowDays] = useState<7 | 14>(7);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => new URLSearchParams({ sleepDebtDays: String(windowDays) }).toString(), [windowDays]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const [res1, res2] = await Promise.all([
          fetch(`/api/insights/summary?${qs}`, { cache: "no-store" }),
          fetch(`/api/insights/sleep-debt-trend?window=${windowDays}&points=14`, { cache: "no-store" }),
        ]);

        const json1 = (await res1.json()) as { sleepDebt?: Insights["sleepDebt"]; streaks?: Insights["streaks"]; error?: string };
        if (!res1.ok) throw new Error(json1.error || "Kunne ikke hente indsigter");

        const json2 = (await res2.json()) as { series?: SleepDebtTrend["series"]; error?: string };
        if (!res2.ok) throw new Error(json2.error || "Kunne ikke hente søvngæld-trend");

        if (!cancelled) {
          setData({ sleepDebt: json1.sleepDebt!, streaks: json1.streaks! });
          setTrend({ series: json2.series ?? [] });
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fejl");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qs, windowDays]);

  const trendValues = trend?.series?.map((p) => p.debtHours) ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <Card>
          <CardHeader title={`Søvngæld (${windowDays} dage)`} description="Hvor meget søvn du mangler ift. dit mål." />
          <CardBody>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-sm text-neutral-600 dark:text-neutral-300">Trend (14 dage)</div>
              <div className="inline-flex overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setWindowDays(7)}
                  className={`px-2 py-1 text-xs ${windowDays === 7 ? "bg-black/5 dark:bg-white/10" : "bg-transparent"}`}
                >
                  7d
                </button>
                <button
                  type="button"
                  onClick={() => setWindowDays(14)}
                  className={`px-2 py-1 text-xs ${windowDays === 14 ? "bg-black/5 dark:bg-white/10" : "bg-transparent"}`}
                >
                  14d
                </button>
              </div>
            </div>

            <div className="mb-3">
              <Sparkline values={trendValues} label="Søvngæld trend" />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            {!data ? (
              <div className="text-sm text-neutral-600 dark:text-neutral-300">Henter…</div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-semibold tracking-tight">{data.sleepDebt.debtHours} t</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                  Mål: {data.sleepDebt.goalHours?.toFixed(1)}t/nat · Snit: {data.sleepDebt.avgSleepHours?.toFixed(1) ?? "—"}t
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                  Forslag i aften: sigt efter {Math.min(10, Math.max(7, (data.sleepDebt.goalHours ?? 7.5) + data.sleepDebt.debtHours / 3)).toFixed(1)}t søvn.
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="lg:col-span-6">
        <Card>
          <CardHeader title="Streaks" description="Dage i træk hvor du rammer dine mål." />
          <CardBody>
            {error && <div className="text-sm text-red-600">{error}</div>}
            {!data ? (
              <div className="text-sm text-neutral-600 dark:text-neutral-300">Henter…</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Steps (mål {data.streaks.stepsGoal})</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">{data.streaks.stepsStreak}</div>
                </div>
                <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Søvn (mål {data.streaks.sleepGoalHours.toFixed(1)}t)</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">{data.streaks.sleepStreak}</div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

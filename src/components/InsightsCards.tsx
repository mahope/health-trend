"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

type Insights = {
  sleepDebt: { debtHours: number; avgSleepHours?: number; goalHours?: number };
  streaks: { stepsStreak: number; sleepStreak: number; stepsGoal: number; sleepGoalHours: number };
};

export function InsightsCards() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/insights/summary", { cache: "no-store" });
        const json = (await res.json()) as { sleepDebt?: Insights["sleepDebt"]; streaks?: Insights["streaks"]; error?: string };
        if (!res.ok) throw new Error(json.error || "Kunne ikke hente indsigter");
        if (!cancelled) setData({ sleepDebt: json.sleepDebt!, streaks: json.streaks! });
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fejl");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <Card>
          <CardHeader title="Søvngæld (7 dage)" description="Hvor meget søvn du mangler ift. dit mål." />
          <CardBody>
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

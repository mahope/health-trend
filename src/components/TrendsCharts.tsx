"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

type Item = {
  day: string;
  steps: number | null;
  restingHr: number | null;
  stressAvg: number | null;
  sleepHours: number | null;
  bodyBatteryLow: number | null;
  risk: "OK" | "LOW" | "MED" | "HIGH" | null;
};

function shortDay(d: string) {
  return d.slice(5);
}

function mapRisk(r: Item["risk"]) {
  if (r === "OK") return 0;
  if (r === "LOW") return 1;
  if (r === "MED") return 2;
  if (r === "HIGH") return 3;
  return null;
}

function EmptyTrends({ days }: { days: number }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white/40 p-5 text-sm text-neutral-700 dark:border-white/15 dark:bg-black/15 dark:text-neutral-200">
      <div className="font-medium">Ingen trend-data endnu</div>
      <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        Når du har taget mindst ét snapshot, dukker der en graf op for de seneste {days} dage.
      </div>
      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
        <Link
          href="/snapshots"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus-visible:ring-white/20"
        >
          Tag dit første snapshot
        </Link>
        <Link
          href="/garmin"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/10 dark:bg-black/30 dark:text-neutral-100 dark:hover:bg-black/45 dark:focus-visible:ring-white/20"
        >
          Tjek Garmin data
        </Link>
      </div>
    </div>
  );
}

export function TrendsCharts({ days = 14 }: { days?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"steps" | "stress" | "sleep" | "risk">("steps");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const res = await fetch(`/api/trends?days=${days}`, { cache: "no-store" });
        const json = (await res.json()) as { items?: Item[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Kunne ikke hente trends");
        if (!cancelled) setItems(json.items ?? []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fejl");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const data = useMemo(
    () =>
      items.map((x) => ({
        ...x,
        dayShort: shortDay(x.day),
        riskScore: mapRisk(x.risk),
      })),
    [items],
  );

  function TabButton({
    id,
    label,
  }: {
    id: "steps" | "stress" | "sleep" | "risk";
    label: string;
  }) {
    const active = tab === id;
    return (
      <button
        className={
          "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
          (active
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "bg-black/5 text-neutral-700 hover:bg-black/10 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15")
        }
        onClick={() => setTab(id)}
        type="button"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Mobile: single chart with tabs */}
      <Card className="lg:hidden">
        <CardHeader
          title={`Trends (sidste ${days} dage)`}
          description="Vælg metric."
          right={
            <div className="flex flex-wrap gap-2">
              <TabButton id="steps" label="Steps" />
              <TabButton id="stress" label="Stress" />
              <TabButton id="sleep" label="Søvn" />
              <TabButton id="risk" label="Risk" />
            </div>
          }
        />
        <CardBody>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          {!error && items.length === 0 ? (
            <EmptyTrends days={days} />
          ) : (
            <>
              <div className="h-64 min-h-[256px]">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="dayShort" tick={{ fontSize: 12 }} />

                      {tab === "risk" ? (
                        <>
                          <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="riskScore"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                            name="Risk"
                          />
                        </>
                      ) : (
                        <>
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          {tab === "steps" ? (
                            <Line type="monotone" dataKey="steps" stroke="#111827" strokeWidth={2} dot={false} name="Steps" />
                          ) : null}
                          {tab === "stress" ? (
                            <Line type="monotone" dataKey="stressAvg" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Stress" />
                          ) : null}
                          {tab === "sleep" ? (
                            <Line type="monotone" dataKey="sleepHours" stroke="#10b981" strokeWidth={2} dot={false} name="Søvn (h)" />
                          ) : null}
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
              {tab === "risk" ? (
                <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  OK=0 · LOW=1 · MED=2 · HIGH=3
                </div>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      {/* Desktop: two charts */}
      <Card className="hidden lg:block lg:col-span-8">
        <CardHeader
          title={`Trends (sidste ${days} dage)`}
          description="Steps, stress og søvn (seneste snapshot pr. dag)."
        />
        <CardBody>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          {!error && items.length === 0 ? (
            <EmptyTrends days={days} />
          ) : (
            <div className="h-64 min-h-[256px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="dayShort" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="steps" stroke="#111827" strokeWidth={2} dot={false} name="Steps" />
                    <Line yAxisId="right" type="monotone" dataKey="stressAvg" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Stress" />
                    <Line yAxisId="right" type="monotone" dataKey="sleepHours" stroke="#10b981" strokeWidth={2} dot={false} name="Søvn (h)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="hidden lg:block lg:col-span-4">
        <CardHeader title="Risk" description="AI brief risk score over tid." />
        <CardBody>
          {!error && items.length === 0 ? (
            <EmptyTrends days={days} />
          ) : (
            <>
              <div className="h-64 min-h-[256px]">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="dayShort" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="riskScore" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Risk" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">OK=0 · LOW=1 · MED=2 · HIGH=3</div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

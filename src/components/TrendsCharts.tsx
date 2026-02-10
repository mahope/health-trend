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
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState } from "@/components/EmptyState";

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
    <EmptyState
      title="Ingen trend-data endnu"
      description={
        <>
          Når du har taget mindst ét snapshot, dukker der en graf op for de seneste {days} dage.
        </>
      }
      actions={
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <LinkButton href="/snapshots" variant="primary">
            Tag dit første snapshot
          </LinkButton>
          <LinkButton href="/garmin" variant="secondary">
            Tjek Garmin data
          </LinkButton>
        </div>
      }
    />
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
            ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-text)]"
            : "bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-active)]")
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
          {error ? <div className="text-sm text-[color:var(--text-error)]">{error}</div> : null}

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
                <div className="mt-2 text-xs text-[color:var(--text-caption)]">
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
          {error ? <div className="text-sm text-[color:var(--text-error)]">{error}</div> : null}

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
              <div className="mt-2 text-xs text-[color:var(--text-caption)]">OK=0 · LOW=1 · MED=2 · HIGH=3</div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

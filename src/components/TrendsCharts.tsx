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

export function TrendsCharts({ days = 14 }: { days?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-8">
        <CardHeader
          title={`Trends (sidste ${days} dage)`}
          description="Steps, stress og søvn (seneste snapshot pr. dag)."
        />
        <CardBody>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="h-64 min-h-[256px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="dayShort" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="steps"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={false}
                  name="Steps"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="stressAvg"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  name="Stress"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sleepHours"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Søvn (h)"
                />
              </LineChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="lg:col-span-4">
        <CardHeader title="Risk" description="AI brief risk score over tid." />
        <CardBody>
          <div className="h-64 min-h-[256px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="dayShort" tick={{ fontSize: 12 }} />
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
              </LineChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            OK=0 · LOW=1 · MED=2 · HIGH=3
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

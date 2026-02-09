"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type WeeklyAi = {
  headline?: string;
  wins?: string[];
  risks?: string[];
  focusNextWeek?: string[];
  oneSmallHabit?: string;
};

type WeeklyReport = {
  ok: true;
  summary: unknown;
  ai: WeeklyAi | null;
};

export default function WeeklyReportPage() {
  const [data, setData] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/weekly?ai=1", { cache: "no-store" });
      const json = (await res.json()) as unknown;
      const err = (json as { error?: string } | null)?.error;
      if (!res.ok) throw new Error(err || "Kunne ikke hente report");
      setData(json as WeeklyReport);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Ugereview"
          description="AI-baseret opsummering af sidste 7 dage."
          right={
            <Button size="sm" onClick={load} disabled={loading}>
              {loading ? "Henter…" : "Refresh"}
            </Button>
          }
        />
        <CardBody>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!data ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-300">Henter…</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Headline</div>
                <div className="text-lg font-semibold tracking-tight">{data.ai?.headline || "—"}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium">Wins</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                    {(data.ai?.wins || []).map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium">Risici</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                    {(data.ai?.risks || []).map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium">Fokus næste uge</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                    {(data.ai?.focusNextWeek || []).map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
                <div className="text-sm font-medium">Én lille vane</div>
                <div className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                  {data.ai?.oneSmallHabit || "—"}
                </div>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-neutral-600 dark:text-neutral-300">Vis rå data</summary>
                <pre className="mt-2 overflow-auto rounded-xl bg-black/5 p-3 text-xs dark:bg-white/10">
                  {JSON.stringify(data.summary, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

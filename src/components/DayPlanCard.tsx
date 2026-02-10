"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TabGroup } from "@/components/ui/TabGroup";
import { Skeleton } from "@/components/ui/Skeleton";

type Deterministic = {
  intensity: "let" | "moderat" | "hård";
  reason: string;
  suggestions: string[];
  avoid: string[];
  bedtimeHint: string;
};

type AiPlan = {
  intensity?: "let" | "moderat" | "hård";
  headline?: string;
  focus?: string;
  doToday?: string[];
  avoid?: string[];
  caffeine?: string;
  bedtime?: string;
};

type PlanResp = {
  ok: true;
  day: string;
  basedOnDay?: string;
  deterministic: Deterministic;
  ai: AiPlan | null;
};

function intensityLabel(x: string) {
  if (x === "let") return "LET";
  if (x === "hård") return "HÅRD";
  return "MODERAT";
}

export function DayPlanCard() {
  const [today, setToday] = useState<PlanResp | null>(null);
  const [tomorrow, setTomorrow] = useState<PlanResp | null>(null);
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlan(url: string, fallbackMsg: string) {
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as { error?: string } & Partial<PlanResp>;
      if (!res.ok) throw new Error(json.error || fallbackMsg);
      return json as PlanResp;
    }

    (async () => {
      try {
        const [t, tm] = await Promise.all([
          fetchPlan("/api/plan/today?ai=1", "Kunne ikke hente dagsplan"),
          fetchPlan("/api/plan/tomorrow?ai=1", "Kunne ikke hente plan for i morgen"),
        ]);
        if (!cancelled) {
          setToday(t);
          setTomorrow(tm);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fejl");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const data = tab === "today" ? today : tomorrow;
  const intensity = data?.ai?.intensity || data?.deterministic.intensity;

  return (
    <Card>
      <CardHeader
        title={tab === "today" ? "Plan i dag" : "Plan i morgen"}
        description={
          tab === "today"
            ? "Konkrete forslag baseret på Garmin + din kontekst."
            : "En realistisk plan for i morgen — baseret på i dag."
        }
        right={
          <div className="flex items-center gap-2">
            <TabGroup
              tabs={[
                { id: "today", label: "I dag" },
                { id: "tomorrow", label: "I morgen" },
              ]}
              active={tab}
              onChange={(id) => setTab(id as "today" | "tomorrow")}
            />

            {intensity ? (
              <Badge tone={intensity === "let" ? "low" : intensity === "hård" ? "med" : "neutral"}>
                {intensityLabel(intensity)}
              </Badge>
            ) : null}
          </div>
        }
      />
      <CardBody>
        {error && <div className="text-sm text-[color:var(--text-error)]">{error}</div>}
        {!data ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-neutral-700 dark:text-neutral-200">
              <div className="font-medium">{data.ai?.headline || "Dagens fokus"}</div>
              <div className="text-neutral-600 dark:text-neutral-300">
                {data.ai?.focus || data.deterministic.reason}
              </div>
            </div>

            {/* Mobile: compact + expand */}
            <details className="md:hidden rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Gør i dag + undgå</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Tryk for at åbne</div>
                </div>
                <div className="mt-2 grid gap-2">
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Top 3</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                      {(data.ai?.doToday?.length ? data.ai.doToday : data.deterministic.suggestions)
                        .slice(0, 3)
                        .map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              </summary>

              <div className="mt-3 grid gap-3">
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Gør i dag</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                    {(data.ai?.doToday?.length ? data.ai.doToday : data.deterministic.suggestions)
                      .slice(0, 6)
                      .map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Undgå</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                    {(data.ai?.avoid?.length ? data.ai.avoid : data.deterministic.avoid)
                      .slice(0, 5)
                      .map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </details>

            {/* Desktop: expanded */}
            <div className="hidden md:grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Gør i dag</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                  {(data.ai?.doToday?.length ? data.ai.doToday : data.deterministic.suggestions)
                    .slice(0, 6)
                    .map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                </ul>
              </div>
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Undgå</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                  {(data.ai?.avoid?.length ? data.ai.avoid : data.deterministic.avoid)
                    .slice(0, 5)
                    .map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[color:var(--border-subtle)] p-3 text-sm">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Koffein</div>
                <div className="mt-1 text-neutral-700 dark:text-neutral-200">
                  {data.ai?.caffeine || "Hold koffein tidligere på dagen (helst før kl. 14)."}
                </div>
              </div>
              <div className="rounded-xl border border-[color:var(--border-subtle)] p-3 text-sm">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Sengetid</div>
                <div className="mt-1 text-neutral-700 dark:text-neutral-200">
                  {data.ai?.bedtime || data.deterministic.bedtimeHint}
                </div>
              </div>
            </div>

            <a className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white" href="/insights">
              Se flere indsigter →
            </a>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

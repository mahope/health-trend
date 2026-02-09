"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
  deterministic: Deterministic;
  ai: AiPlan | null;
};

function intensityLabel(x: string) {
  if (x === "let") return "LET";
  if (x === "hård") return "HÅRD";
  return "MODERAT";
}

export function DayPlanCard() {
  const [data, setData] = useState<PlanResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/plan/today?ai=1", { cache: "no-store" });
        const json = (await res.json()) as { error?: string } & Partial<PlanResp>;
        if (!res.ok) throw new Error(json.error || "Kunne ikke hente dagsplan");
        if (!cancelled) setData(json as PlanResp);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fejl");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const intensity = data?.ai?.intensity || data?.deterministic.intensity;

  return (
    <Card>
      <CardHeader
        title="Plan i dag"
        description="Konkrete forslag baseret på Garmin + din kontekst."
        right={
          intensity ? (
            <Badge tone={intensity === "let" ? "low" : intensity === "hård" ? "med" : "neutral"}>
              {intensityLabel(intensity)}
            </Badge>
          ) : undefined
        }
      />
      <CardBody>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!data ? (
          <div className="text-sm text-neutral-600 dark:text-neutral-300">Henter…</div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-neutral-700 dark:text-neutral-200">
              <div className="font-medium">{data.ai?.headline || "Dagens fokus"}</div>
              <div className="text-neutral-600 dark:text-neutral-300">
                {data.ai?.focus || data.deterministic.reason}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Gør i dag</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                  {(data.ai?.doToday?.length ? data.ai.doToday : data.deterministic.suggestions).slice(0, 6).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Undgå</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                  {(data.ai?.avoid?.length ? data.ai.avoid : data.deterministic.avoid).slice(0, 5).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-black/10 p-3 text-sm dark:border-white/10">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Koffein</div>
                <div className="mt-1 text-neutral-700 dark:text-neutral-200">
                  {data.ai?.caffeine || "Hold koffein tidligere på dagen (helst før kl. 14)."}
                </div>
              </div>
              <div className="rounded-xl border border-black/10 p-3 text-sm dark:border-white/10">
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

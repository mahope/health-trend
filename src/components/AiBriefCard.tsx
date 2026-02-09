"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Brief = {
  day: string;
  risk: "OK" | "LOW" | "MED" | "HIGH";
  short: string;
  signals: Array<{ name: string; value: string; why: string }>;
  suggestions: Array<{ title: string; detail: string }>;
  createdAt: string;
};

function toneForRisk(risk: Brief["risk"]): "ok" | "low" | "med" | "high" {
  if (risk === "HIGH") return "high";
  if (risk === "MED") return "med";
  if (risk === "LOW") return "low";
  return "ok";
}

export function AiBriefCard({ day }: { day: string }) {
  const [item, setItem] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const res = await fetch("/api/ai/brief", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ day }),
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json?.error || "Kunne ikke lave brief");
              setItem(json.item);
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "Fejl");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Genererer…" : "Generér AI brief"}
        </Button>

        {item?.risk && <Badge tone={toneForRisk(item.risk)}>Risk: {item.risk}</Badge>}
      </div>

      {item ? (
        <div className="rounded-2xl border border-black/10 bg-white/50 p-5 shadow-sm dark:border-white/10 dark:bg-black/20 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold tracking-tight">Kort fortalt</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {new Date(item.createdAt).toLocaleString("da-DK", { hour12: false })}
            </div>
          </div>

          <div className="text-sm text-neutral-800 dark:text-neutral-100">
            {item.short}
          </div>

          {item.signals?.length ? (
            <div>
              <div className="text-sm font-semibold">Signaler</div>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {item.signals.map((s, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20"
                  >
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {s.why}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {item.suggestions?.length ? (
            <div>
              <div className="text-sm font-semibold">Forslag</div>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {item.suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20"
                  >
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                      {s.detail}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Tryk for at generere. (Kræver OPENAI_API_KEY)
        </div>
      )}

      {error && (
        <div className={cn("text-sm text-red-600")}>{error}</div>
      )}
    </div>
  );
}

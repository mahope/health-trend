"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/date";
import { ResponsiveSection } from "@/components/ui/ResponsiveSection";

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
  const { toast } = useToast();
  const [item, setItem] = useState<Brief | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitialLoading(true);
      try {
        const res = await fetch(`/api/ai/brief?day=${encodeURIComponent(day)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as { item?: Brief | null };
        if (!res.ok) return;
        if (!cancelled) setItem(json.item ?? null);
      } catch {
        // ignore on load
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [day]);

  return (
    <div className="space-y-4">

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
              toast({ title: "Brief genereret ✓", kind: "success", vibrateMs: 15 });
            } catch (e: unknown) {
              const raw = e instanceof Error ? e.message : "Fejl";
              const msg = raw === "no_snapshots" ? "Tag mindst ét snapshot først." : raw;
              setError(msg);
              toast({ title: msg, kind: "error", vibrateMs: 45 });
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Genererer…" : "Generér brief"}
        </Button>

        {item?.risk && <Badge tone={toneForRisk(item.risk)}>Risk: {item.risk}</Badge>}
      </div>

      {item ? (
        <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold tracking-tight">Overblik</div>
            <div className="text-xs text-[color:var(--text-caption)]">
              {formatDateTime(item.createdAt)}
            </div>
          </div>

          <div className="text-sm leading-relaxed text-[color:var(--text-primary)]">
            {item.short}
          </div>

          {item.signals?.length ? (
            <ResponsiveSection
              title="Signaler"
              badge={<div className="text-xs text-[color:var(--text-caption)]">{item.signals.length} stk.</div>}
              hint="Tryk for at åbne"
            >
              <ul className="grid gap-2 md:grid-cols-2">
                {item.signals.map((s, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-[color:var(--text-caption)]">{s.value}</div>
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--text-tertiary)]">{s.why}</div>
                  </li>
                ))}
              </ul>
            </ResponsiveSection>
          ) : null}

          {item.suggestions?.length ? (
            <ResponsiveSection
              title="Forslag"
              badge={<div className="text-xs text-[color:var(--text-caption)]">{item.suggestions.length} stk.</div>}
              hint="Tryk for at åbne"
            >
              <ul className="grid gap-2 md:grid-cols-2">
                {item.suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3"
                  >
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="mt-1 text-sm text-[color:var(--text-secondary)]">{s.detail}</div>
                  </li>
                ))}
              </ul>
            </ResponsiveSection>
          ) : null}
        </div>
      ) : initialLoading ? (
        <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3"
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Ingen brief endnu"
          description={
            <>
              Start med et snapshot + evt. lidt manual-kontekst — og generér så en brief. (Kræver <code>OPENAI_API_KEY</code>.)
            </>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <LinkButton href="#snapshots" variant="primary" size="sm">
                Tag snapshot
              </LinkButton>
              <LinkButton href="#manual" variant="secondary" size="sm">
                Udfyld manual
              </LinkButton>
            </div>
          }
        />
      )}

      {error && <div className={cn("text-sm text-[color:var(--text-error)]")}>{error}</div>}
    </div>
  );
}

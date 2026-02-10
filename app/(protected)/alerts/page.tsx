"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, InlineEmptyLink } from "@/components/EmptyState";

type Alert = {
  id: string;
  day: string;
  severity: "LOW" | "MED" | "HIGH";
  title: string;
  body: string;
  createdAt: string;
  deliveredAt?: string | null;
};

function tone(sev: Alert["severity"]) {
  if (sev === "HIGH") return "high" as const;
  if (sev === "MED") return "med" as const;
  return "low" as const;
}

export default function AlertsPage() {
  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts/list?undelivered=1", { cache: "no-store" });
      const json = (await res.json()) as { items?: Alert[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Kunne ikke hente alerts");
      setItems(json.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Alerts"
          description="Autogenererede advarsler (MED/HIGH) fra AI brief job."
          right={
            <button
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? "Henter…" : "Refresh"}
            </button>
          }
        />
        <CardBody>
          {error && <div className="text-sm text-red-600">{error}</div>}

          {items.length === 0 ? (
            <EmptyState
              title="Ingen alerts lige nu"
              description={
                <>
                  Alerts kommer typisk først efter du har taget snapshots og der er blevet genereret AI brief for nogle dage.
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Start her: <InlineEmptyLink href="/snapshots">tag et snapshot</InlineEmptyLink> og kig på <InlineEmptyLink href="/">Dashboard</InlineEmptyLink>.
                  </div>
                </>
              }
              actions={
                <div className="grid gap-2">
                  <Link
                    href="/snapshots"
                    className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-control)] bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)] dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    Gå til Snapshots
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-control)] px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-[color:var(--surface-control-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)] dark:text-neutral-100"
                  >
                    Åbn Dashboard
                  </Link>
                  <Button variant="ghost" className="w-full" disabled={loading} onClick={refresh}>
                    {loading ? "Henter…" : "Refresh"}
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid gap-3">
              {items.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-black/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-tight">{a.title}</div>
                      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {a.day} · {new Date(a.createdAt).toLocaleString("da-DK", { hour12: false })}
                      </div>
                    </div>
                    <Badge tone={tone(a.severity)}>{a.severity}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-neutral-800 dark:text-neutral-100">
                    {a.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

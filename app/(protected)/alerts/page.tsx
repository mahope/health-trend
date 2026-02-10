"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState, InlineEmptyLink } from "@/components/EmptyState";
import { formatDateTime } from "@/lib/date";

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
              className="text-sm text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? "Henter…" : "Refresh"}
            </button>
          }
        />
        <CardBody>
          {error && <div className="text-sm text-[color:var(--text-error)]">{error}</div>}

          {items.length === 0 ? (
            <EmptyState
              title="Ingen alerts lige nu"
              description={
                <>
                  Alerts kommer typisk først efter du har taget snapshots og der er blevet genereret AI brief for nogle dage.
                  <div className="mt-2 text-xs text-[color:var(--text-caption)]">
                    Start her: <InlineEmptyLink href="/snapshots">tag et snapshot</InlineEmptyLink> og kig på <InlineEmptyLink href="/">Dashboard</InlineEmptyLink>.
                  </div>
                </>
              }
              actions={
                <div className="grid gap-2">
                  <LinkButton href="/snapshots" variant="primary" className="w-full">
                    Gå til Snapshots
                  </LinkButton>
                  <LinkButton href="/" variant="secondary" className="w-full">
                    Åbn Dashboard
                  </LinkButton>
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
                  className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-tight">{a.title}</div>
                      <div className="mt-1 text-xs text-[color:var(--text-caption)]">
                        {a.day} · {formatDateTime(a.createdAt)}
                      </div>
                    </div>
                    <Badge tone={tone(a.severity)}>{a.severity}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-[color:var(--text-primary)]">
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

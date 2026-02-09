"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Activity = {
  id: string;
  startTimeLocal?: string;
  activityName?: string;
  activityType?: string;
  durationMinutes?: number;
  distanceKm?: number;
  calories?: number;
};

function fmtWhen(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("da-DK", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivitiesPage() {
  const [limit, setLimit] = useState(10);
  const [days, setDays] = useState(14);
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/activities/recent?limit=${encodeURIComponent(String(limit))}&days=${encodeURIComponent(String(days))}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as { items?: Activity[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Kunne ikke hente aktiviteter");
      setItems(json.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Aktiviteter"
          description="Seneste aktiviteter udledt fra dine snapshots."
          right={
            <Button size="sm" disabled={loading} onClick={refresh}>
              {loading ? "Henter…" : "Refresh"}
            </Button>
          }
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400">Limit</label>
              <Input
                inputMode="numeric"
                value={String(limit)}
                onChange={(e) => setLimit(Number(e.target.value || 10))}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400">Lookback (dage)</label>
              <Input
                inputMode="numeric"
                value={String(days)}
                onChange={(e) => setDays(Number(e.target.value || 14))}
              />
            </div>
            <div className="md:pt-6">
              <Button
                size="sm"
                variant="primary"
                disabled={loading}
                onClick={refresh}
              >
                {loading ? "Opdaterer…" : "Anvend"}
              </Button>
            </div>
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Liste" description={items.length ? `${items.length} aktiviteter` : "Ingen endnu"} />
        <CardBody>
          {items.length === 0 ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              Ingen aktiviteter fundet (endnu). Tag et nyt snapshot efter du har trænet.
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {items.map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {a.activityName || a.activityType || "Aktivitet"}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {fmtWhen(a.startTimeLocal)}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-neutral-600 dark:text-neutral-300 text-right">
                    {a.distanceKm != null ? `${a.distanceKm.toFixed(1)} km` : ""}{
                      a.distanceKm != null && a.durationMinutes != null ? " · " : ""
                    }
                    {a.durationMinutes != null ? `${Math.round(a.durationMinutes)} min` : ""}{
                      (a.distanceKm != null || a.durationMinutes != null) && a.calories != null
                        ? " · "
                        : ""
                    }
                    {a.calories != null ? `${Math.round(a.calories)} kcal` : ""}
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

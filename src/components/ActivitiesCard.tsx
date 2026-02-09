"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

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
  return d.toLocaleString("da-DK", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ActivitiesCard({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const res = await fetch(`/api/activities/recent?limit=${limit}`, { cache: "no-store" });
        const json = (await res.json()) as { items?: Activity[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Kunne ikke hente aktiviteter");
        if (!cancelled) setItems(json.items ?? []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fejl");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <Card>
      <CardHeader
        title="Aktiviteter"
        description={`Seneste ${limit} (fra snapshots).`}
        right={
          <a
            className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            href="/activities"
          >
            Se alle
          </a>
        }
      />
      <CardBody>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {items.length === 0 ? (
          <div className="text-sm text-neutral-600 dark:text-neutral-300">Ingen aktiviteter fundet endnu.</div>
        ) : (
          <>
            {/* Mobile: show only first 3 */}
            <div className="md:hidden divide-y divide-black/5 dark:divide-white/10">
              {items.slice(0, 3).map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.activityName || a.activityType || "Aktivitet"}</div>
                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{fmtWhen(a.startTimeLocal)}</div>
                  </div>
                  <div className="shrink-0 text-xs text-neutral-600 dark:text-neutral-300 text-right">
                    {a.distanceKm != null ? `${a.distanceKm.toFixed(1)} km` : ""}
                  </div>
                </div>
              ))}
              {items.length > 3 ? (
                <div className="py-3">
                  <a className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white" href="/activities">
                    Se alle aktiviteter →
                  </a>
                </div>
              ) : null}
            </div>

            {/* Desktop: show all */}
            <div className="hidden md:block divide-y divide-black/5 dark:divide-white/10">
              {items.map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.activityName || a.activityType || "Aktivitet"}</div>
                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{fmtWhen(a.startTimeLocal)}</div>
                  </div>
                  <div className="shrink-0 text-xs text-neutral-600 dark:text-neutral-300 text-right">
                    {a.distanceKm != null ? `${a.distanceKm.toFixed(1)} km` : ""}{
                      a.distanceKm != null && a.durationMinutes != null ? " · " : ""
                    }
                    {a.durationMinutes != null ? `${Math.round(a.durationMinutes)} min` : ""}{
                      (a.distanceKm != null || a.durationMinutes != null) && a.calories != null ? " · " : ""
                    }
                    {a.calories != null ? `${Math.round(a.calories)} kcal` : ""}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

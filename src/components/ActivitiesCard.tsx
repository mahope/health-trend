"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";

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

type Streak = { current: number; longest: number; lastDayHad: string | null };

type StreaksResp = {
  streaks?: { walk: Streak; run: Streak; strength: Streak };
};

export function ActivitiesCard({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [streaks, setStreaks] = useState<StreaksResp["streaks"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const [activitiesResult, streaksResult] = await Promise.allSettled([
        fetch(`/api/activities/recent?limit=${limit}`, { cache: "no-store" }).then(async (res) => {
          const json = (await res.json()) as { items?: Activity[]; error?: string };
          if (!res.ok) throw new Error(json.error || "Kunne ikke hente aktiviteter");
          return json.items ?? [];
        }),
        fetch(`/api/activities/streaks?days=60`, { cache: "no-store" }).then(async (res) => {
          const json = (await res.json()) as StreaksResp;
          if (!res.ok) return null;
          return json.streaks ?? null;
        }),
      ]);
      if (cancelled) return;
      if (activitiesResult.status === "fulfilled") {
        setItems(activitiesResult.value);
      } else {
        setError(activitiesResult.reason instanceof Error ? activitiesResult.reason.message : "Fejl");
      }
      if (streaksResult.status === "fulfilled" && streaksResult.value) {
        setStreaks(streaksResult.value);
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
          <Link
            className="text-sm text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
            href="/activities"
          >
            Se alle
          </Link>
        }
      />
      <CardBody>
        {streaks ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                { key: "run", label: "Løb" },
                { key: "walk", label: "Gåtur" },
                { key: "strength", label: "Styrke" },
              ] as const
            ).map(({ key, label }) => {
              const s = streaks[key];
              const cur = s?.current ?? 0;
              const max = s?.longest ?? 0;
              return (
                <div
                  key={key}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-control)] px-3 py-1.5 text-xs text-[color:var(--text-secondary)]"
                  title={max > 0 ? `${label}: ${cur} dage i træk (max ${max})` : `${label}: ingen streak endnu`}
                >
                  <span className="font-medium">{label}</span>
                  <span className="text-[color:var(--text-caption)]">{cur > 0 ? `${cur}d` : "—"}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {error && <div className="text-sm text-[color:var(--text-error)]">{error}</div>}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-5 text-sm text-[color:var(--text-secondary)]">
            <div className="font-medium">Ingen aktiviteter endnu</div>
            <div className="mt-1 text-sm text-[color:var(--text-tertiary)]">
              Aktiviteter kommer fra dine snapshots (Garmin eksport). Tag dit første snapshot for at begynde at se dem.
            </div>
            <div className="mt-4">
              <LinkButton href="#snapshots" variant="primary" size="sm">
                Tag snapshot
              </LinkButton>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: show only first 3 */}
            <div className="md:hidden divide-y divide-[color:var(--divide-color)]">
              {items.slice(0, 3).map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.activityName || a.activityType || "Aktivitet"}</div>
                    <div className="mt-1 text-xs text-[color:var(--text-caption)]">{fmtWhen(a.startTimeLocal)}</div>
                  </div>
                  <div className="shrink-0 text-xs text-[color:var(--text-tertiary)] text-right">
                    {a.distanceKm != null ? `${a.distanceKm.toFixed(1)} km` : ""}
                  </div>
                </div>
              ))}
              {items.length > 3 ? (
                <div className="py-3">
                  <Link className="text-sm text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]" href="/activities">
                    Se alle aktiviteter →
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Desktop: show all */}
            <div className="hidden md:block divide-y divide-[color:var(--divide-color)]">
              {items.map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.activityName || a.activityType || "Aktivitet"}</div>
                    <div className="mt-1 text-xs text-[color:var(--text-caption)]">{fmtWhen(a.startTimeLocal)}</div>
                  </div>
                  <div className="shrink-0 text-xs text-[color:var(--text-tertiary)] text-right">
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

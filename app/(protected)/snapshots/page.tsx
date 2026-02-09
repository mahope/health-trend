"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Snapshot = {
  id: string;
  day: string;
  takenAt: string;
  steps?: number | null;
  restingHr?: number | null;
  stressAvg?: number | null;
  sleepHours?: number | null;
  bodyBatteryHigh?: number | null;
  bodyBatteryLow?: number | null;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function todayCphClient(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function SnapshotsPage() {
  const [day, setDay] = useState(todayCphClient());
  const [items, setItems] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/snapshots/list?day=${encodeURIComponent(day)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { items?: Snapshot[]; error?: string };
      if (!res.ok) throw new Error(json?.error || "Kunne ikke hente snapshots");
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
  }, [day]);

  const deltas = useMemo(() => {
    if (items.length < 2) return [] as Array<{ a: Snapshot; b: Snapshot; dSteps?: number | null }>;
    const out: Array<{ a: Snapshot; b: Snapshot; dSteps?: number | null }> = [];
    for (let i = 1; i < items.length; i++) {
      const a = items[i - 1];
      const b = items[i];
      out.push({
        a,
        b,
        dSteps:
          a.steps != null && b.steps != null ? (b.steps as number) - (a.steps as number) : null,
      });
    }
    return out;
  }, [items]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Snapshots"
          description="Tag snapshots (morgen/middag/aften) og se udvikling."
          right={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const res = await fetch("/api/snapshots/take", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ day }),
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json?.error || "Kunne ikke tage snapshot");
                    await refresh();
                  } catch (e: unknown) {
                    setError(e instanceof Error ? e.message : "Fejl");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Arbejder…" : "Tag snapshot"}
              </Button>
              <Button size="sm" disabled={loading} onClick={refresh}>
                Refresh
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400">Dag</label>
              <Input
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 md:pt-6">
              Snapshot læses lokalt fra{" "}
              <code>C:/Users/mads_/Garmin/data/garmin-YYYY-MM-DD.json</code> og gemmes.
            </div>
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardHeader title="Liste" description="Tidsstempler (lokal tid)." />
          <CardBody>
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                  Ingen snapshots endnu.
                </div>
              ) : (
                items.map((x) => (
                  <div key={x.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="text-neutral-800 dark:text-neutral-100">
                      {fmtTime(x.takenAt)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-neutral-600 dark:text-neutral-300">Steps: {x.steps ?? "—"}</div>
                      <button
                        className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200"
                        onClick={async () => {
                          const ok = confirm("Slet snapshot? (kan ikke fortrydes)");
                          if (!ok) return;
                          setLoading(true);
                          setError(null);
                          try {
                            const res = await fetch("/api/snapshots/delete", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ id: x.id }),
                            });
                            const json = await res.json().catch(() => ({}));
                            if (!res.ok) throw new Error(json.error || "Kunne ikke slette");
                            await refresh();
                          } catch (e: unknown) {
                            setError(e instanceof Error ? e.message : "Fejl");
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        Slet
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader title="Delta" description="Udvikling mellem snapshots." />
          <CardBody>
            <div className="space-y-2">
              {deltas.length === 0 ? (
                <div className="text-sm text-neutral-600 dark:text-neutral-300">
                  Tag mindst 2 snapshots.
                </div>
              ) : (
                deltas.map((d) => (
                  <div key={d.b.id} className="flex items-center justify-between text-sm">
                    <div className="text-neutral-800 dark:text-neutral-100">
                      {fmtTime(d.a.takenAt)} → {fmtTime(d.b.takenAt)}
                    </div>
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Δ steps: {d.dSteps ?? "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

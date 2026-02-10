"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ToastProvider";
import { EmptyState, InlineEmptyLink } from "@/components/EmptyState";

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

type TakeSnapshotError = {
  code?: string;
  message: string;
  file?: string;
  hint?: string;
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
  const { toast } = useToast();
  const [day, setDay] = useState(todayCphClient());
  const [items, setItems] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TakeSnapshotError | null>(null);

  const expectedPath = `C:/Users/mads_/Garmin/data/garmin-${day}.json`;

  async function copyExpectedPath() {
    try {
      await navigator.clipboard.writeText(expectedPath);
      toast({ title: "Filsti kopieret ✓", kind: "success", vibrateMs: 10 });
    } catch {
      toast({ title: "Kunne ikke kopiere filsti", kind: "error", vibrateMs: 20 });
    }
  }

  const pendingDelete = useRef<null | { id: string; handle: number }>(null);

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
      setError({ message: e instanceof Error ? e.message : "Fejl" });
    } finally {
      setLoading(false);
    }
  }

  async function takeSnapshot() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snapshots/take", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        file?: string;
        hint?: string;
      };

      if (!res.ok) {
        if (json?.error === "missing_garmin_file") {
          setError({
            code: json.error,
            message: "Mangler Garmin-fil til den valgte dag.",
            file: json.file,
            hint: json.hint,
          });
          toast({ title: "Mangler Garmin-fil", kind: "error", vibrateMs: 35 });
          return;
        }

        const msg = json?.error || "Kunne ikke tage snapshot";
        setError({ message: msg });
        toast({ title: msg, kind: "error", vibrateMs: 45 });
        return;
      }

      toast({ title: "Snapshot taget ✓", kind: "success", vibrateMs: 12 });
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Fejl";
      setError({ message: msg });
      toast({ title: msg, kind: "error", vibrateMs: 45 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  const deltas = useMemo(() => {
    if (items.length < 2) return [] as Array<{ a: Snapshot; b: Snapshot; dSteps?: number | null }>; // at least 2 to compare
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
              <Button size="sm" disabled={loading} onClick={takeSnapshot}>
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
              <Input value={day} onChange={(e) => setDay(e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 md:pt-6">
              Snapshot læses lokalt fra{" "}
              <code>C:/Users/mads_/Garmin/data/garmin-YYYY-MM-DD.json</code>.
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-50/60 p-4 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-200">
              <div className="font-medium">{error.message}</div>
              {(error.hint || error.file) && (
                <div className="mt-1 text-xs text-red-700/90 dark:text-red-200/80">
                  {error.hint ? <div>{error.hint}</div> : null}
                  {error.file ? (
                    <div>
                      Fil: <code className="break-all">{error.file}</code>
                    </div>
                  ) : null}
                </div>
              )}

              {error.code === "missing_garmin_file" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="ghost" disabled={loading} onClick={copyExpectedPath}>
                    Kopiér filsti
                  </Button>
                  <Link
                    href="/garmin"
                    className="inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-white/20 bg-white/20 px-3 text-xs font-medium text-red-900/90 transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 dark:border-white/15 dark:bg-white/5 dark:text-red-100"
                  >
                    Åbn Garmin
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardHeader title="Liste" description="Tidsstempler (lokal tid)." />
          <CardBody>
            <div className="space-y-2">
              {items.length === 0 ? (
                <EmptyState
                  title="Ingen snapshots endnu"
                  description={
                    <>
                      <div>Kom i gang i 2 steps:</div>
                      <ol className="mt-2 list-decimal space-y-1 pl-4">
                        <li>
                          Sørg for at der ligger en Garmin eksport for dagen (fx{" "}
                          <code className="break-all">garmin-{day}.json</code>).
                        </li>
                        <li>Tryk “Tag første snapshot”.</li>
                      </ol>
                      <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        Snapshot læses lokalt fra <code className="break-all">{expectedPath}</code>.
                      </div>
                      <div className="mt-2">
                        Tip: tag typisk 2–3 snapshots om dagen (morgen/middag/aften).
                      </div>
                    </>
                  }
                  actions={
                    <div className="grid gap-2">
                      <Button className="w-full" variant="primary" disabled={loading} onClick={takeSnapshot}>
                        {loading ? "Arbejder…" : "Tag første snapshot"}
                      </Button>
                      <Button className="w-full" variant="ghost" disabled={loading} onClick={copyExpectedPath}>
                        Kopiér filsti
                      </Button>
                      <Link
                        href="/garmin"
                        className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-control)] px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-[color:var(--surface-control-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)] dark:text-neutral-100"
                      >
                        Tjek Garmin data
                      </Link>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Hvis den fejler, får du en sti/hint herover.
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Se også: <InlineEmptyLink href="/garmin">Garmin</InlineEmptyLink>
                      </div>
                    </div>
                  }
                />
              ) : (
                items.map((x) => (
                  <div key={x.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="text-neutral-800 dark:text-neutral-100">{fmtTime(x.takenAt)}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-neutral-600 dark:text-neutral-300">Steps: {x.steps ?? "—"}</div>
                      <button
                        className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-300 dark:hover:text-rose-200"
                        onClick={() => {
                          // If we already have a pending delete, commit it now (so undo stays simple).
                          if (pendingDelete.current) {
                            window.clearTimeout(pendingDelete.current.handle);
                            pendingDelete.current = null;
                          }

                          setError(null);

                          // Optimistic UI: remove immediately, then actually delete after 30s.
                          const prevItems = items;
                          setItems((cur) => cur.filter((s) => s.id !== x.id));

                          const handle = window.setTimeout(async () => {
                            setLoading(true);
                            try {
                              const res = await fetch("/api/snapshots/delete", {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ id: x.id }),
                              });
                              const json = (await res.json().catch(() => ({}))) as { error?: string };
                              if (!res.ok) throw new Error(json.error || "Kunne ikke slette");
                              await refresh();
                            } catch (e: unknown) {
                              // Restore list on failure.
                              setItems(prevItems);
                              setError({ message: e instanceof Error ? e.message : "Fejl" });
                              toast({ title: "Kunne ikke slette snapshot", kind: "error", vibrateMs: 20 });
                            } finally {
                              pendingDelete.current = null;
                              setLoading(false);
                            }
                          }, 30_000);

                          pendingDelete.current = { id: x.id, handle };

                          toast({
                            title: "Snapshot slettes om 30s",
                            kind: "info",
                            durationMs: 30_000,
                            sticky: true,
                            actionLabel: "Fortryd",
                            onAction: () => {
                              if (pendingDelete.current?.id !== x.id) return;
                              window.clearTimeout(handle);
                              pendingDelete.current = null;
                              setItems(prevItems);
                              toast({ title: "Sletning fortrudt", kind: "success", vibrateMs: 10 });
                            },
                          });
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
                <EmptyState
                  title={items.length === 0 ? "Ingen data at sammenligne" : "Tag mindst 2 snapshots"}
                  description={
                    items.length === 0 ? (
                      <>Når du har taget første snapshot, kan du begynde at sammenligne udvikling mellem dem.</>
                    ) : (
                      <>Når du tager et snapshot mere (fx i eftermiddag), viser vi delta her.</>
                    )
                  }
                />
              ) : (
                deltas.map((d) => (
                  <div key={d.b.id} className="flex items-center justify-between text-sm">
                    <div className="text-neutral-800 dark:text-neutral-100">
                      {fmtTime(d.a.takenAt)} → {fmtTime(d.b.takenAt)}
                    </div>
                    <div className="text-neutral-600 dark:text-neutral-300">Δ steps: {d.dSteps ?? "—"}</div>
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

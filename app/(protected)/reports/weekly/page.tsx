"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";

type WeeklyAi = {
  headline?: string;
  wins?: string[];
  risks?: string[];
  focusNextWeek?: string[];
  oneSmallHabit?: string;
};

type WeeklyReport = {
  ok: true;
  summary: unknown;
  ai: WeeklyAi | null;
};

function formatWeeklyShareText(r: WeeklyReport) {
  const w = (r.summary as { window?: { startDay?: string; endDay?: string } } | null)?.window;
  const start = w?.startDay || "";
  const end = w?.endDay || "";

  const lines: string[] = [];
  lines.push(`Ugereview${start && end ? ` (${start} → ${end})` : ""}`);
  lines.push("");
  if (r.ai?.headline) lines.push(r.ai.headline);
  lines.push("");

  const addList = (title: string, xs?: string[]) => {
    if (!xs?.length) return;
    lines.push(title);
    for (const x of xs) lines.push(`- ${x}`);
    lines.push("");
  };

  addList("Wins:", r.ai?.wins);
  addList("Risici:", r.ai?.risks);
  addList("Fokus næste uge:", r.ai?.focusNextWeek);

  if (r.ai?.oneSmallHabit) {
    lines.push("Én lille vane:");
    lines.push(r.ai.oneSmallHabit);
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

async function safeCopyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: old-school textarea
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.focus();
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function WeeklyReportPage() {
  const [data, setData] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/weekly?ai=1", { cache: "no-store" });
      const json = (await res.json()) as unknown;
      const err = (json as { error?: string } | null)?.error;
      if (!res.ok) throw new Error(err || "Kunne ikke hente report");
      setData(json as WeeklyReport);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Ugereview"
          description="AI-baseret opsummering af sidste 7 dage."
          right={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={!data || sharing}
                onClick={async () => {
                  if (!data) return;
                  const text = formatWeeklyShareText(data);
                  const ok = await safeCopyToClipboard(text);
                  toast({
                    title: ok ? "Kopieret ✓" : "Kunne ikke kopiere",
                    kind: ok ? "success" : "error",
                    vibrateMs: ok ? 10 : 30,
                  });
                }}
              >
                Kopiér
              </Button>

              <Button
                size="sm"
                variant="ghost"
                disabled={!data || sharing}
                onClick={async () => {
                  if (!data) return;
                  const text = formatWeeklyShareText(data);
                  setSharing(true);
                  try {
                    if ("share" in navigator) {
                      await navigator.share({ title: "Ugereview", text });
                      toast({ title: "Delt ✓", kind: "success", vibrateMs: 10 });
                    } else {
                      const ok = await safeCopyToClipboard(text);
                      toast({
                        title: ok ? "Kopieret (share ikke understøttet)" : "Share ikke understøttet",
                        kind: ok ? "info" : "error",
                        vibrateMs: ok ? 8 : 30,
                      });
                    }
                  } catch {
                    // Share was cancelled or failed
                    toast({ title: "Deling afbrudt", kind: "info", vibrateMs: 0 });
                  } finally {
                    setSharing(false);
                  }
                }}
              >
                Del
              </Button>

              <Button
                size="sm"
                variant="ghost"
                disabled={!data || sharing}
                onClick={() => {
                  if (!data) return;
                  const w = (data.summary as { window?: { startDay?: string; endDay?: string } } | null)?.window;
                  const start = w?.startDay || "";
                  const end = w?.endDay || "";
                  const filename = `ugereview${start && end ? `_${start}_${end}` : ""}.md`;
                  downloadTextFile(filename, formatWeeklyShareText(data));
                  toast({ title: "Downloadet ✓", kind: "success", vibrateMs: 8 });
                }}
              >
                Gem
              </Button>

              <Button size="sm" onClick={load} disabled={loading}>
                {loading ? "Henter…" : "Refresh"}
              </Button>
            </div>
          }
        />
        <CardBody>
          {error && <div className="text-sm text-[color:var(--text-error)]">{error}</div>}
          {!data ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-300">Henter…</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Headline</div>
                <div className="text-lg font-semibold tracking-tight">{data.ai?.headline || "—"}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium">Wins</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                    {(data.ai?.wins || []).map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium">Risici</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                    {(data.ai?.risks || []).map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium">Fokus næste uge</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                    {(data.ai?.focusNextWeek || []).map((x: string, i: number) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[color:var(--border-subtle)] p-3">
                <div className="text-sm font-medium">Én lille vane</div>
                <div className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                  {data.ai?.oneSmallHabit || "—"}
                </div>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-neutral-600 dark:text-neutral-300">Vis rå data</summary>
                <pre className="mt-2 overflow-auto rounded-xl bg-black/5 p-3 text-xs dark:bg-white/10">
                  {JSON.stringify(data.summary, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

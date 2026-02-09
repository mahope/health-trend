"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { TogglePill } from "@/components/ui/TogglePill";
import { cn } from "@/lib/cn";

type Manual = {
  day: string;
  symptomScore: number | null;
  caffeineCups: number | null;
  alcoholUnits: number | null;
  notes: string | null;
  trained: boolean | null;
  meds: boolean | null;
};

export function ManualForm({ day }: { day: string }) {
  const [item, setItem] = useState<Manual | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const res = await fetch(`/api/manual/get?day=${encodeURIComponent(day)}`);
      const json = await res.json();
      if (!res.ok) {
        if (!cancelled) setError(json?.error || "Kunne ikke hente manual");
        return;
      }
      const rec = (json.item || {
        day,
        symptomScore: null,
        caffeineCups: null,
        alcoholUnits: null,
        notes: "",
        trained: null,
        meds: null,
      }) as Manual;
      if (!cancelled) setItem(rec);
    })();
    return () => {
      cancelled = true;
    };
  }, [day]);

  async function save(patch: Partial<Manual>) {
    if (!item) return;
    const next = { ...item, ...patch };
    setItem(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/manual/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Kunne ikke gemme");
      setItem(json.item);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fejl");
    } finally {
      setSaving(false);
    }
  }

  if (!item) {
    return <div className="text-sm text-neutral-500">Henter…</div>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs text-neutral-500">Sygdomstegn (0-3)</label>
          <select
            className={cn(
              "h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black/30 dark:text-neutral-100 dark:focus:border-white/20 dark:focus:ring-white/10",
            )}
            value={item.symptomScore ?? ""}
            onChange={(e) =>
              save({ symptomScore: e.target.value === "" ? null : Number(e.target.value) })
            }
          >
            <option value="">(tom)</option>
            <option value={0}>0 - ingen</option>
            <option value={1}>1 - let</option>
            <option value={2}>2 - tydelig</option>
            <option value={3}>3 - kraftig</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-neutral-500">Koffein (kopper)</label>
          <Input
            inputMode="numeric"
            value={item.caffeineCups ?? ""}
            onChange={(e) => save({ caffeineCups: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-500">Alkohol (units)</label>
          <Input
            inputMode="numeric"
            value={item.alcoholUnits ?? ""}
            onChange={(e) => save({ alcoholUnits: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <TogglePill
            label="Trænet"
            checked={item.trained ?? false}
            onChange={(next) => save({ trained: next })}
          />
          <TogglePill
            label="Medicin"
            checked={item.meds ?? false}
            onChange={(next) => save({ meds: next })}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500">Noter</label>
        <textarea
          className={cn(
            "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-black/20 focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black/30 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-white/20 dark:focus:ring-white/10",
            "min-h-28",
          )}
          value={item.notes ?? ""}
          onChange={(e) => save({ notes: e.target.value })}
        />
      </div>

      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {saving ? "Gemmer…" : ""}
      </div>
    </div>
  );
}

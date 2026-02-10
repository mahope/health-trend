"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { TogglePill } from "@/components/ui/TogglePill";
import { FormField } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ToastProvider";

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
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const lastOkToastAt = useRef(0);
  const justSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setJustSaved(false);
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

      // Inline autosave status
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
      setJustSaved(true);
      justSavedTimer.current = setTimeout(() => setJustSaved(false), 2500);

      // Success toast (rate-limited, because we autosave a lot)
      const now = Date.now();
      if (now - lastOkToastAt.current > 15000) {
        lastOkToastAt.current = now;
        toast({ title: "Gemt ✓", kind: "success", vibrateMs: 8 });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Fejl";
      setError(msg);
      toast({ title: msg, kind: "error", vibrateMs: 35 });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    return () => {
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
    };
  }, []);

  if (!item) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const currentItem = item;

  function inc(
    key: "caffeineCups" | "alcoholUnits" | "symptomScore",
    delta: number,
    opts?: { min?: number; max?: number },
  ) {
    const raw = currentItem[key];
    const current = typeof raw === "number" ? raw : 0;
    const next = current + delta;
    const bounded = Math.min(opts?.max ?? Infinity, Math.max(opts?.min ?? -Infinity, next));
    save({ [key]: bounded } as Partial<Manual>);
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-[color:var(--text-error)]">{error}</div>}

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={() => inc("caffeineCups", 1, { min: 0 })}
        >
          +1 koffein
        </Button>
        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={() => inc("alcoholUnits", 1, { min: 0 })}
        >
          +1 alkohol
        </Button>
        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={() => inc("symptomScore", 1, { min: 0, max: 3 })}
        >
          symptom +1
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0 rounded-full"
          onClick={() => save({ caffeineCups: null, alcoholUnits: null, symptomScore: null })}
        >
          nulstil
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <FormField label="Sygdomstegn (0-3)">
          <Select
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
          </Select>
        </FormField>

        <FormField label="Koffein (kopper)">
          <Input
            inputMode="numeric"
            value={item.caffeineCups ?? ""}
            onChange={(e) => save({ caffeineCups: e.target.value ? Number(e.target.value) : null })}
          />
        </FormField>

        <FormField label="Alkohol (units)">
          <Input
            inputMode="numeric"
            value={item.alcoholUnits ?? ""}
            onChange={(e) => save({ alcoholUnits: e.target.value ? Number(e.target.value) : null })}
          />
        </FormField>

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

      <FormField label="Noter">
        <Textarea
          className="min-h-28"
          value={item.notes ?? ""}
          onChange={(e) => save({ notes: e.target.value })}
        />
      </FormField>

      <div className="text-xs text-[color:var(--text-caption)]">
        {saving ? "Gemmer…" : justSaved ? "Gemt ✓" : ""}
      </div>
    </div>
  );
}

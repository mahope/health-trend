"use client";

import { cn } from "@/lib/cn";

export function TogglePill({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3 text-sm transition-colors",
        "border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] text-neutral-800 hover:bg-[color:var(--surface-control)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)] dark:text-neutral-100 dark:hover:bg-[color:var(--surface-control-hover)]",
        checked &&
          "border-black/15 bg-black/5 text-neutral-900 dark:border-white/20 dark:bg-white/10",
      )}
      aria-pressed={checked}
    >
      {label}
    </button>
  );
}

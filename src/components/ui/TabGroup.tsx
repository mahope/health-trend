"use client";

import { cn } from "@/lib/cn";

type Tab = {
  id: string;
  label: string;
};

export function TabGroup({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-0.5 text-xs",
        className,
      )}
    >
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.id)}
            className={cn(
              "h-8 rounded-md px-2.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)]",
              selected
                ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-text)]"
                : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-hover)]",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

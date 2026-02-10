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
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

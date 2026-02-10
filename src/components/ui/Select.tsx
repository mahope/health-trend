"use client";

import { cn } from "@/lib/cn";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: Props) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-[var(--radius-control)] border bg-[color:var(--surface-control)] px-3 text-sm text-[color:var(--text-primary)] shadow-sm outline-none",
        "border-[color:var(--border-subtle)] focus-visible:border-[color:var(--focus-border)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)]",
        className,
      )}
      {...props}
    />
  );
}

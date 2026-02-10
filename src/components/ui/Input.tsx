"use client";

import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[var(--radius-control)] border bg-[color:var(--surface-control)] px-3 text-sm text-[color:var(--text-primary)] shadow-sm outline-none",
        "border-[color:var(--border-subtle)] placeholder:text-[color:var(--text-caption)] focus-visible:border-[color:var(--focus-border)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)]",
        className,
      )}
      {...props}
    />
  );
}

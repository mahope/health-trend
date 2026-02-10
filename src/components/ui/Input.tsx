"use client";

import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[var(--radius-control)] border bg-[color:var(--surface-control)] px-3 text-sm text-neutral-900 shadow-sm outline-none",
        "border-[color:var(--border-subtle)] placeholder:text-neutral-400 focus-visible:border-black/20 focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)]",
        "dark:bg-[color:var(--surface-control)] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-white/20",
        className,
      )}
      {...props}
    />
  );
}

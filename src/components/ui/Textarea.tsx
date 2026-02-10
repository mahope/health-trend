"use client";

import { cn } from "@/lib/cn";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--radius-control)] border bg-[color:var(--surface-control)] px-3 py-2 text-sm text-[color:var(--text-primary)] shadow-sm outline-none",
        "border-[color:var(--border-subtle)] placeholder:text-[color:var(--text-caption)] focus-visible:border-[color:var(--focus-border)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)]",
        className,
      )}
      {...props}
    />
  );
}

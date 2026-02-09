"use client";

import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-black/20 focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black/30 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-white/20 dark:focus:ring-white/10",
        className,
      )}
      {...props}
    />
  );
}

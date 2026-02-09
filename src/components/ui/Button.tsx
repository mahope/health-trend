"use client";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20";

  const variants: Record<Variant, string> = {
    primary:
      "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
    secondary:
      "border border-black/10 bg-white hover:bg-neutral-50 text-neutral-900 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/45 dark:text-neutral-100",
    ghost:
      "hover:bg-black/5 text-neutral-800 dark:hover:bg-white/10 dark:text-neutral-100",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

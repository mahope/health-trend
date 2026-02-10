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
    "inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)]";

  const variants: Record<Variant, string> = {
    primary:
      "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-text)] hover:bg-[color:var(--button-primary-hover)]",
    secondary:
      "border border-[color:var(--border-subtle)] bg-[color:var(--surface-control)] hover:bg-[color:var(--surface-control-hover)] text-[color:var(--text-primary)]",
    ghost:
      "hover:bg-[color:var(--bg-hover)] text-[color:var(--text-primary)]",
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

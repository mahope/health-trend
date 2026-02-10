import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary";

type Props = React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: "sm" | "md";
};

export function LinkButton({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-subtle)]";

  const variants: Record<Variant, string> = {
    primary:
      "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
    secondary:
      "border border-[color:var(--border-subtle)] bg-[color:var(--surface-control)] hover:bg-[color:var(--surface-control-hover)] text-neutral-900 dark:text-neutral-100",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  };

  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

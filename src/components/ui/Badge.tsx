import { cn } from "@/lib/cn";

export function Badge({
  className,
  children,
  tone = "neutral",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "low" | "med" | "high";
}) {
  const tones: Record<string, string> = {
    neutral:
      "bg-[color:var(--bg-hover)] text-[color:var(--text-secondary)]",
    ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
    low: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
    med: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    high: "bg-rose-500/15 text-rose-800 dark:text-rose-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

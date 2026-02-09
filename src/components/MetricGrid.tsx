import { cn } from "@/lib/cn";

export function MetricGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-3 sm:grid-cols-2", className)}>{children}</div>;
}

export function MetricTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {value}
        </div>
        {delta ? (
          <div className="text-xs text-neutral-500 dark:text-neutral-400">{delta}</div>
        ) : null}
      </div>
    </div>
  );
}

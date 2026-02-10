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
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3">
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

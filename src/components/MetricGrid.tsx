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
      <div className="text-xs text-[color:var(--text-caption)]">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-[color:var(--text-primary)]">
          {value}
        </div>
        {delta ? (
          <div className="text-xs text-[color:var(--text-caption)]">{delta}</div>
        ) : null}
      </div>
    </div>
  );
}

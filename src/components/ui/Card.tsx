import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[color:var(--surface-card-blur)]",
        "border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  title,
  description,
  right,
}: {
  className?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        // Mobile-first: stack header content + actions to avoid cramped button rows.
        "flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div>
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        {description && (
          <div className="mt-1 text-sm text-[color:var(--text-tertiary)]">
            {description}
          </div>
        )}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}

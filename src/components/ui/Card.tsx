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
    <div className={cn("flex items-start justify-between gap-4 p-5", className)}>
      <div>
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        {description && (
          <div className="mt-1 text-sm text-[color:var(--text-muted)] dark:text-[color:var(--text-muted-dark)]">
            {description}
          </div>
        )}
      </div>
      {right}
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

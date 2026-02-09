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
        "rounded-2xl border border-black/10 bg-white/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-black/40",
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
          <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
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

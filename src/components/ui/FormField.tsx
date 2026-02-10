import { cn } from "@/lib/cn";

export function FormField({
  label,
  description,
  className,
  children,
}: {
  label: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-xs text-[color:var(--text-caption)]">
        {label}
      </div>
      {children}
      {description && (
        <div className="text-xs text-[color:var(--text-caption)]">
          {description}
        </div>
      )}
    </div>
  );
}

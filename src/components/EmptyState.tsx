import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[color:var(--border-dashed)] bg-[color:var(--surface-inset)] p-5 text-sm text-[color:var(--text-secondary)]",
        className,
      )}
    >
      <div className="font-medium">{title}</div>
      {description ? (
        <div className="mt-1 text-sm text-[color:var(--text-tertiary)]">{description}</div>
      ) : null}
      {actions ? <div className="mt-4">{actions}</div> : null}
    </div>
  );
}

export function InlineEmptyLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="underline decoration-[color:var(--text-caption)] underline-offset-2 hover:decoration-[color:var(--text-secondary)]"
    >
      {children}
    </Link>
  );
}

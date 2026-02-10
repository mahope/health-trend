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
        "rounded-2xl border border-dashed border-black/15 bg-white/40 p-5 text-sm text-neutral-700 dark:border-white/15 dark:bg-black/15 dark:text-neutral-200",
        className,
      )}
    >
      <div className="font-medium">{title}</div>
      {description ? (
        <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{description}</div>
      ) : null}
      {actions ? <div className="mt-4">{actions}</div> : null}
    </div>
  );
}

export function InlineEmptyLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-700 dark:decoration-neutral-600 dark:hover:decoration-neutral-300"
    >
      {children}
    </Link>
  );
}

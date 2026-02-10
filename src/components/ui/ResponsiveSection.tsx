"use client";

import { cn } from "@/lib/cn";

export function ResponsiveSection({
  title,
  badge,
  hint,
  children,
  className,
}: {
  title: string;
  badge?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      {/* Mobile: collapsible */}
      <details
        className={cn(
          "md:hidden rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3",
          className,
        )}
      >
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{title}</div>
            {badge}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-[color:var(--text-caption)]">
              {hint}
            </div>
          )}
        </summary>
        <div className="mt-3">{children}</div>
      </details>

      {/* Desktop: always expanded */}
      <div
        className={cn(
          "hidden md:block space-y-3",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          {badge}
        </div>
        {children}
      </div>
    </>
  );
}

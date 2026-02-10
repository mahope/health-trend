"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { nav, isActive } from "@/lib/nav";

export function MobileNav({
  open,
  onClose,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}) {
  const pathname = usePathname() || "/";
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap: Tab / Shift+Tab
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;

        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (!focusable.length) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // Focus first focusable element when panel opens
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const first = panel.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      {/* backdrop */}
      <button
        aria-label="Luk menu"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        tabIndex={-1}
      />

      {/* panel */}
      <div
        ref={panelRef}
        className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-[color:var(--surface-card)] backdrop-blur border-r border-[color:var(--border-subtle)] shadow-xl"
      >
        <div className="p-4">
          <div className="text-sm font-semibold tracking-tight">Health Trend</div>
          <div className="mt-1 text-xs text-[color:var(--text-tertiary)]">
            {userEmail}
          </div>

          <nav className="mt-4 grid gap-1">
            {nav.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onClose}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-[color:var(--bg-selected)] text-[color:var(--text-primary)]"
                      : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-hover)]",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 flex items-center justify-between gap-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Luk
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await authClient.signOut();
                window.location.href = "/login";
              }}
            >
              Log ud
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

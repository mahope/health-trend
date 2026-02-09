"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/snapshots", label: "Snapshots" },
  { href: "/alerts", label: "Alerts" },
  { href: "/activities", label: "Aktiviteter" },
  { href: "/garmin", label: "Garmin" },
  { href: "/settings", label: "Settings" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* backdrop */}
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* panel */}
      <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-white/95 backdrop-blur border-r border-black/10 shadow-xl dark:bg-black/80 dark:border-white/10">
        <div className="p-4">
          <div className="text-sm font-semibold tracking-tight">Health Trend</div>
          <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
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
                      ? "bg-black/5 text-neutral-900 dark:bg-white/10 dark:text-white"
                      : "text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/10",
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

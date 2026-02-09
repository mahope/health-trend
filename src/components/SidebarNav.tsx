"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

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

export function SidebarNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className="mt-4 grid gap-1">
      {nav.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
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
  );
}

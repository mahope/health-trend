"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { nav, isActive } from "@/lib/nav";

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
                ? "bg-[color:var(--bg-selected)] text-[color:var(--text-primary)]"
                : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-hover)]",
            )}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

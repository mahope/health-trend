"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";

function initials(email: string) {
  const name = email.split("@")[0] || "U";
  const parts = name.split(/[._-]+/).filter(Boolean);
  const a = (parts[0]?.[0] || name[0] || "U").toUpperCase();
  const b = (parts[1]?.[0] || name[1] || "").toUpperCase();
  return (a + b).slice(0, 2);
}

export function UserMenu({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const initialsText = useMemo(() => initials(userEmail), [userEmail]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function onPointerDown(e: PointerEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur hover:bg-white/90 dark:border-white/10 dark:bg-black/20 dark:text-neutral-100 dark:hover:bg-black/30"
        aria-label="Åbn bruger-menu"
      >
        {initialsText}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-black/10 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-white/10 dark:bg-black/70">
          <div className="px-2 py-2">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Logget ind som</div>
            <div className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">{userEmail}</div>
          </div>

          <div className="px-2 py-2">
            <ThemeToggle />
          </div>

          <a
            href="/settings"
            className="block rounded-lg px-2 py-2 text-sm text-neutral-800 hover:bg-black/5 dark:text-neutral-100 dark:hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            Settings
          </a>

          <button
            type="button"
            className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-neutral-800 hover:bg-black/5 dark:text-neutral-100 dark:hover:bg-white/10"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/login";
            }}
          >
            Log ud
          </button>
        </div>
      ) : null}
    </div>
  );
}

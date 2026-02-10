"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initialsText = useMemo(() => initials(userEmail), [userEmail]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      // Arrow key navigation within menu items
      const menu = menuRef.current;
      if (!menu) return;

      const items = Array.from(
        menu.querySelectorAll<HTMLElement>("[role='menuitem']"),
      );
      if (!items.length) return;

      const currentIdx = items.findIndex((el) => el === document.activeElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = currentIdx < items.length - 1 ? currentIdx + 1 : 0;
        items[next]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = currentIdx > 0 ? currentIdx - 1 : items.length - 1;
        items[prev]?.focus();
      }
    }

    function onPointerDown(e: PointerEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) close();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  // Focus first menu item on open
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (!menu) return;
    const first = menu.querySelector<HTMLElement>("[role='menuitem']");
    first?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] text-sm font-semibold text-[color:var(--text-primary)] shadow-sm backdrop-blur hover:bg-[color:var(--surface-control-hover)]"
        aria-label="Åbn bruger-menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initialsText}
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-2 shadow-lg backdrop-blur"
        >
          <div className="px-2 py-2">
            <div className="text-xs text-[color:var(--text-caption)]">Logget ind som</div>
            <div className="text-sm font-medium truncate text-[color:var(--text-primary)]">{userEmail}</div>
          </div>

          <div className="px-2 py-2">
            <ThemeToggle />
          </div>

          <a
            href="/settings"
            role="menuitem"
            tabIndex={-1}
            className="block rounded-lg px-2 py-2 text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--bg-hover)] focus:bg-[color:var(--bg-hover)] focus:outline-none"
            onClick={() => setOpen(false)}
          >
            Settings
          </a>

          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--bg-hover)] focus:bg-[color:var(--bg-hover)] focus:outline-none"
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

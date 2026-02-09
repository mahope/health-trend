"use client";

import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
};

type ToastApi = {
  toast: (t: { title: string; kind?: ToastKind; vibrateMs?: number }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function safeVibrate(ms: number) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      // Some browsers/PWA contexts may ignore this.
      navigator.vibrate(ms);
    }
  } catch {
    // ignore
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const toast = useCallback((t: { title: string; kind?: ToastKind; vibrateMs?: number }) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const kind: ToastKind = t.kind ?? "info";
    const next: Toast = { id, kind, title: t.title };

    setItems((prev) => {
      const keep = prev.slice(-2); // cap queue size
      return [...keep, next];
    });

    if (t.vibrateMs && t.vibrateMs > 0) safeVibrate(t.vibrateMs);

    const handle = window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
      timers.current.delete(id);
    }, 2200);
    timers.current.set(id, handle);
  }, []);

  const api = useMemo<ToastApi>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={(id) => setItems((prev) => prev.filter((x) => x.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
      <div className="flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur",
              "bg-white/95 text-neutral-900 border-black/10",
              "dark:bg-black/70 dark:text-neutral-100 dark:border-white/10",
              t.kind === "success" && "border-emerald-500/30",
              t.kind === "error" && "border-red-500/30",
            )}
            role="status"
            aria-live="polite"
            onClick={() => onDismiss(t.id)}
          >
            {t.title}
          </div>
        ))}
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider />");
  return ctx;
}

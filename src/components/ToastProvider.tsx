"use client";

import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  sticky?: boolean;
};

type ToastApi = {
  toast: (t: {
    title: string;
    kind?: ToastKind;
    vibrateMs?: number;
    durationMs?: number;
    actionLabel?: string;
    onAction?: () => void;
    sticky?: boolean;
  }) => void;
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

  const toast = useCallback(
    (t: {
      title: string;
      kind?: ToastKind;
      vibrateMs?: number;
      durationMs?: number;
      actionLabel?: string;
      onAction?: () => void;
      sticky?: boolean;
    }) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const kind: ToastKind = t.kind ?? "info";
      const next: Toast = {
        id,
        kind,
        title: t.title,
        actionLabel: t.actionLabel,
        onAction: t.onAction,
        sticky: t.sticky,
      };

      setItems((prev) => {
        const sticky = prev.filter((x) => x.sticky);
        const nonSticky = prev.filter((x) => !x.sticky);
        const keep = nonSticky.slice(-2); // cap queue size (non-sticky)
        return [...sticky, ...keep, next];
      });

      if (t.vibrateMs && t.vibrateMs > 0) safeVibrate(t.vibrateMs);

      const durationMs = t.durationMs ?? 2200;
      if (durationMs > 0) {
        const handle = window.setTimeout(() => {
          setItems((prev) => prev.filter((x) => x.id !== id));
          timers.current.delete(id);
        }, durationMs);
        timers.current.set(id, handle);
      }
    },
    [],
  );

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
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1" onClick={() => onDismiss(t.id)}>
                {t.title}
              </div>
              {t.actionLabel && t.onAction ? (
                <button
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-600 dark:text-neutral-100 dark:decoration-white/30 dark:hover:decoration-white/70"
                  onClick={() => {
                    try {
                      t.onAction?.();
                    } finally {
                      onDismiss(t.id);
                    }
                  }}
                >
                  {t.actionLabel}
                </button>
              ) : null}
            </div>
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

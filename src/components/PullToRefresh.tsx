"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

function isInteractiveTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") return true;
  if (el.closest?.("[contenteditable='true']")) return true;
  return false;
}

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const startY = useRef<number | null>(null);
  const [pullPx, setPullPx] = useState(0);
  const [armed, setArmed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const enabled = useMemo(() => {
    // only enable on touch-ish devices to avoid weird desktop behavior
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  useEffect(() => {
    if (!isPending) return;

    // best-effort: when refresh completes, reset UI
    const t = setTimeout(() => {
      setPullPx(0);
      setArmed(false);
    }, 600);
    return () => clearTimeout(t);
  }, [isPending]);

  function onTouchStart(e: React.TouchEvent) {
    if (!enabled) return;
    if (isPending) return;
    if (isInteractiveTarget(e.target)) return;
    if (window.scrollY > 0) return;

    const y = e.touches[0]?.clientY;
    if (typeof y !== "number") return;

    // only start if gesture begins near the top
    if (y > 90) return;

    startY.current = y;
    setDragging(true);
    setPullPx(0);
    setArmed(false);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!enabled) return;
    if (isPending) return;
    if (startY.current === null) return;
    if (window.scrollY > 0) return;

    const y = e.touches[0]?.clientY;
    if (typeof y !== "number") return;

    const dy = Math.max(0, y - startY.current);
    // ease-out: grows slower the more you pull
    const eased = Math.min(96, Math.round(Math.sqrt(dy) * 10));
    setPullPx(eased);
    setArmed(eased >= 64);

    if (dy > 0) {
      // prevent the browser from scrolling the page while pulling
      e.preventDefault();
    }
  }

  function onTouchEnd() {
    if (!enabled) return;
    if (isPending) return;

    const shouldRefresh = armed;
    startY.current = null;
    setDragging(false);
    setArmed(false);

    if (!shouldRefresh) {
      setPullPx(0);
      return;
    }

    try {
      navigator.vibrate?.(10);
    } catch {
      // ignore
    }

    setPullPx(56);
    startTransition(() => router.refresh());
  }

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex justify-center"
        style={{
          transform: `translateY(${Math.min(64, pullPx) - 64}px)`,
          transition: !dragging ? "transform 150ms ease" : undefined,
        }}
        aria-hidden
      >
        <div className="mt-3 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] px-3 py-1 text-xs text-[color:var(--text-secondary)] shadow-sm backdrop-blur">
          {isPending ? "Opdaterer…" : armed ? "Slip for at opdatere" : "Træk for at opdatere"}
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${pullPx}px)`,
          transition: !dragging ? "transform 180ms ease" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

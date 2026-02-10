"use client";

import { useRef } from "react";
import { useToast } from "@/components/ToastProvider";

export function useRateLimitedToast(intervalMs = 1200) {
  const { toast } = useToast();
  const lastAt = useRef(0);

  function rateLimitedToast(next: Parameters<typeof toast>[0]) {
    const now = Date.now();
    if (now - lastAt.current < intervalMs) return;
    lastAt.current = now;
    toast(next);
  }

  return { toast, rateLimitedToast };
}

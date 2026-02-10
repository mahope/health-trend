"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";

export function NetworkStatusBanner() {
  const { toast } = useToast();
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const prevOnline = useRef(online);

  useEffect(() => {
    function onOnline() {
      setOnline(true);
    }

    function onOffline() {
      setOnline(false);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (prevOnline.current === false && online === true) {
      toast({ title: "Online igen ✓", kind: "success", vibrateMs: 20, durationMs: 1400 });
    }
    prevOnline.current = online;
  }, [online, toast]);

  if (online) return null;

  return (
    <div
      className="mb-3 rounded-xl border border-amber-500/30 bg-amber-50 px-3 py-2 text-sm text-amber-950 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-50"
      role="status"
      aria-live="polite"
    >
      <div className="font-medium">Du er offline</div>
      <div className="text-xs opacity-90">
        Nogle ting (AI, autosave, snapshots) kan fejle indtil forbindelsen er tilbage.
      </div>
    </div>
  );
}

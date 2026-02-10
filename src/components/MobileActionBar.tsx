"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useMobileUi } from "@/components/MobileUiContext";
import { useRateLimitedToast } from "@/hooks/useRateLimitedToast";

function cphYmd() {
  // Get YYYY-MM-DD in Europe/Copenhagen without pulling deps.
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Copenhagen" });
  return s; // en-CA gives 2026-02-09
}

export function MobileActionBar({ manualAnchorId = "manual" }: { manualAnchorId?: string }) {
  const { openMenu } = useMobileUi();
  const { rateLimitedToast } = useRateLimitedToast(1200);
  const [busy, setBusy] = useState<null | "snapshot" | "brief">(null);

  async function call(kind: "snapshot" | "brief") {
    const day = cphYmd();
    setBusy(kind);
    try {
      const url = kind === "snapshot" ? "/api/snapshots/take" : "/api/ai/brief";
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day }),
      });
      const json = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) throw new Error(json.error || "Fejl");

      rateLimitedToast({
        title: kind === "snapshot" ? "Snapshot taget ✓" : "Brief genereret ✓",
        kind: "success",
        vibrateMs: kind === "snapshot" ? 12 : 15,
      });

      // Light refresh: reload current route.
      window.location.reload();
    } catch (e) {
      rateLimitedToast({
        title: e instanceof Error ? e.message : "Fejl",
        kind: "error",
        vibrateMs: 45,
      });
    } finally {
      setBusy(null);
    }
  }

  function jumpToManual() {
    const el = document.getElementById(manualAnchorId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] backdrop-blur">
      <div className="mx-auto max-w-6xl px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2">
        <div className="grid grid-cols-4 gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => call("snapshot")}
          >
            {busy === "snapshot" ? "…" : "Snapshot"}
          </Button>

          <Button
            size="sm"
            variant="primary"
            disabled={busy !== null}
            onClick={() => call("brief")}
          >
            {busy === "brief" ? "…" : "Brief"}
          </Button>

          <Button size="sm" variant="ghost" onClick={jumpToManual}>
            Manual
          </Button>

          <Button size="sm" variant="ghost" onClick={openMenu}>
            Menu
          </Button>
        </div>
      </div>
    </div>
  );
}

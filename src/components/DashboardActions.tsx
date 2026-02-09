"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";

export function DashboardActions({ day }: { day: string }) {
  const [busy, setBusy] = useState<null | "snapshot" | "brief">(null);
  const { toast } = useToast();
  const lastToastAt = useRef(0);

  function rateLimitedToast(next: Parameters<typeof toast>[0]) {
    const now = Date.now();
    if (now - lastToastAt.current < 1200) return;
    lastToastAt.current = now;
    toast(next);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={!!busy}
        onClick={async () => {
          setBusy("snapshot");
          try {
            const res = await fetch("/api/snapshots/take", { method: "POST" });
            const json = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) throw new Error(json?.error || "Kunne ikke tage snapshot");
            rateLimitedToast({ title: "Snapshot taget ✓", kind: "success", vibrateMs: 12 });
            window.location.reload();
          } catch (e: unknown) {
            rateLimitedToast({
              title: e instanceof Error ? e.message : "Snapshot fejlede",
              kind: "error",
              vibrateMs: 40,
            });
          } finally {
            setBusy(null);
          }
        }}
      >
        {busy === "snapshot" ? "Tager…" : "Tag snapshot"}
      </Button>

      <Button
        size="sm"
        variant="primary"
        disabled={!!busy}
        onClick={async () => {
          setBusy("brief");
          try {
            const res = await fetch("/api/ai/brief", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ day }),
            });
            const json = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) throw new Error(json?.error || "Kunne ikke generere brief");
            rateLimitedToast({ title: "Brief genereret ✓", kind: "success", vibrateMs: 15 });
            window.location.reload();
          } catch (e: unknown) {
            rateLimitedToast({
              title: e instanceof Error ? e.message : "Brief fejlede",
              kind: "error",
              vibrateMs: 45,
            });
          } finally {
            setBusy(null);
          }
        }}
      >
        {busy === "brief" ? "Genererer…" : "Generér brief"}
      </Button>
    </div>
  );
}

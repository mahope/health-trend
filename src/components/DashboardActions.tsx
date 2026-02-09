"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function DashboardActions({ day }: { day: string }) {
  const [busy, setBusy] = useState<null | "snapshot" | "brief">(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={!!busy}
        onClick={async () => {
          setBusy("snapshot");
          try {
            await fetch("/api/snapshots/take", { method: "POST" });
            window.location.reload();
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
            await fetch("/api/ai/brief", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ day }),
            });
            window.location.reload();
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

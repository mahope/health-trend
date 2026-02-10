"use client";

import { useEffect, useState } from "react";
import { ymd } from "@/lib/date";

type Brief = {
  short: string;
  createdAt: string;
};

export function AiCoachLine({ text: textProp }: { text?: string | null }) {
  const [fetched, setFetched] = useState<string | null>(null);

  useEffect(() => {
    if (textProp !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const day = ymd(new Date());
        const res = await fetch(`/api/ai/brief?day=${encodeURIComponent(day)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { item?: Brief | null };
        const short = (json.item?.short || "").trim();
        if (!short) return;
        if (!cancelled) setFetched(short);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [textProp]);

  const text = textProp !== undefined ? textProp : fetched;
  if (!text) return null;

  return (
    <div className="mt-1 text-xs text-[color:var(--text-tertiary)]">
      <span className="font-medium">Coach:</span>{" "}
      <span className="truncate align-bottom">{text}</span>
    </div>
  );
}

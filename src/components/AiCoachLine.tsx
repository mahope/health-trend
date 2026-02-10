"use client";

import { useEffect, useState } from "react";
import { ymd } from "@/lib/date";

type Brief = {
  short: string;
  createdAt: string;
};

export function AiCoachLine() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
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
        if (!cancelled) setText(short);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!text) return null;

  return (
    <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
      <span className="font-medium">Coach:</span>{" "}
      <span className="truncate align-bottom">{text}</span>
    </div>
  );
}

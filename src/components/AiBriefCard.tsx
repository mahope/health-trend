"use client";

import { useState } from "react";

type Brief = {
  day: string;
  risk: "OK" | "LOW" | "MED" | "HIGH";
  short: string;
  signals: Array<{ name: string; value: string; why: string }>;
  suggestions: Array<{ title: string; detail: string }>;
  createdAt: string;
};

function riskColor(risk: Brief["risk"]) {
  if (risk === "HIGH") return "text-red-600";
  if (risk === "MED") return "text-amber-600";
  if (risk === "LOW") return "text-green-700";
  return "text-green-900";
}

export function AiBriefCard({ day }: { day: string }) {
  const [item, setItem] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        className="rounded-md bg-black text-white px-3 py-2 disabled:opacity-50"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await fetch("/api/ai/brief", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ day }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Kunne ikke lave brief");
            setItem(json.item);
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Fejl");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Genererer…" : "Generér AI brief"}
      </button>

      {item ? (
        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className={`font-semibold ${riskColor(item.risk)}`}>Risiko: {item.risk}</div>
            <div className="text-xs text-neutral-500">{new Date(item.createdAt).toLocaleString("da-DK")}</div>
          </div>
          <div className="text-sm">{item.short}</div>

          {item.signals?.length ? (
            <div>
              <div className="text-sm font-semibold">Signaler</div>
              <ul className="mt-2 space-y-2">
                {item.signals.map((s, idx) => (
                  <li key={idx} className="text-sm">
                    <div className="font-medium">
                      {s.name}: <span className="text-neutral-600">{s.value}</span>
                    </div>
                    <div className="text-neutral-500 text-xs">{s.why}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {item.suggestions?.length ? (
            <div>
              <div className="text-sm font-semibold">Forslag</div>
              <ul className="mt-2 space-y-2">
                {item.suggestions.map((s, idx) => (
                  <li key={idx} className="text-sm">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-neutral-600">{s.detail}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm text-neutral-500">
          Tryk for at generere. (Kræver OPENAI_API_KEY)
        </div>
      )}
    </div>
  );
}

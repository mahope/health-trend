import React from "react";

type SparklineProps = {
  values: Array<number | null | undefined>;
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  label?: string;
};

export function Sparkline({
  values,
  width = 160,
  height = 36,
  stroke = "currentColor",
  strokeWidth = 2,
  label = "Trend",
}: SparklineProps) {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length < 2) return <div className="h-9" aria-label={label} />;

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;

  const stepX = width / Math.max(1, values.length - 1);

  const pts = values
    .map((v, i) => {
      if (typeof v !== "number" || !Number.isFinite(v)) return null;
      const x = i * stepX;
      const y = height - ((v - min) / span) * height;
      return [x, y] as const;
    })
    .filter((p): p is readonly [number, number] => p != null);

  if (pts.length < 2) return <div className="h-9" aria-label={label} />;

  const d = pts
    .map(([x, y], i) => {
      const xx = Math.round(x * 10) / 10;
      const yy = Math.round(y * 10) / 10;
      return `${i === 0 ? "M" : "L"}${xx},${yy}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="text-emerald-600 dark:text-emerald-400">
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

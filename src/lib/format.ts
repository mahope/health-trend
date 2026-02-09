export function fmtNumber(v: number | null | undefined, suffix = ""): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${v}${suffix}`;
}

export function fmtFloat(v: number | null | undefined, digits = 1, suffix = ""): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${v.toFixed(digits)}${suffix}`;
}

export function fmtDelta(v: number | null | undefined, suffix = ""): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "";
  if (v === 0) return `±0${suffix}`;
  return v > 0 ? `+${v}${suffix}` : `${v}${suffix}`;
}

export function fmtDeltaFloat(v: number | null | undefined, digits = 1, suffix = ""): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "";
  const n = Number(v.toFixed(digits));
  if (n === 0) return `±0${suffix}`;
  return n > 0 ? `+${n.toFixed(digits)}${suffix}` : `${n.toFixed(digits)}${suffix}`;
}

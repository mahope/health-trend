export function ymd(date: Date, tz = "Europe/Copenhagen"): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(d: Date, deltaDays: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + deltaDays);
  return x;
}

export function addDaysYmd(day: string, deltaDays: number, tz = "Europe/Copenhagen"): string {
  // Parse as local-ish date by anchoring at noon to avoid DST edges.
  const base = new Date(`${day}T12:00:00`);
  const next = addDays(base, deltaDays);
  return ymd(next, tz);
}

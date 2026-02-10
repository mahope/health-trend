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

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns true if the string matches YYYY-MM-DD format. */
export function isValidDay(day: string): boolean {
  return DAY_RE.test(day);
}

export function addDaysYmd(day: string, deltaDays: number, tz = "Europe/Copenhagen"): string {
  // Parse as local-ish date by anchoring at noon to avoid DST edges.
  const base = new Date(`${day}T12:00:00`);
  const next = addDays(base, deltaDays);
  return ymd(next, tz);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("da-DK", { hour12: false });
}

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

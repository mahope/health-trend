export const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/snapshots", label: "Snapshots" },
  { href: "/alerts", label: "Alerts" },
  { href: "/activities", label: "Aktiviteter" },
  { href: "/insights", label: "Indsigter" },
  { href: "/reports/weekly", label: "Ugereview" },
  { href: "/garmin", label: "Garmin" },
  { href: "/settings", label: "Settings" },
] as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

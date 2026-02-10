"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarNav } from "@/components/SidebarNav";
import { MobileNav } from "@/components/MobileNav";
import { MobileUiProvider } from "@/components/MobileUiContext";
import { UserMenu } from "@/components/UserMenu";
import { PullToRefresh } from "@/components/PullToRefresh";
import { AiCoachLine } from "@/components/AiCoachLine";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";

function titleForPath(path: string): { title: string; subtitle: string } {
  if (path === "/") return { title: "Dashboard", subtitle: "Din sundheds-stream, destilleret." };
  if (path.startsWith("/snapshots"))
    return { title: "Snapshots", subtitle: "Tag snapshots (morgen/middag/aften) og se udvikling." };
  if (path.startsWith("/alerts"))
    return { title: "Alerts", subtitle: "Autogenererede advarsler (MED/HIGH) fra AI brief job." };
  if (path.startsWith("/activities"))
    return { title: "Aktiviteter", subtitle: "Seneste aktiviteter udledt fra snapshots." };
  if (path.startsWith("/insights"))
    return { title: "Indsigter", subtitle: "Små widgets der hjælper dig i hverdagen." };
  if (path.startsWith("/reports/weekly"))
    return { title: "Ugereview", subtitle: "AI opsummering + fokus til næste uge." };
  if (path.startsWith("/garmin"))
    return { title: "Garmin", subtitle: "Token-only. Importér eksisterende tokens uden login." };
  if (path.startsWith("/settings"))
    return { title: "Settings", subtitle: "2FA (TOTP) og konto." };
  return { title: "Health Trend", subtitle: "" };
}

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { title, subtitle } = titleForPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  // Mandatory onboarding: if not connected to Garmin, push user to /garmin (client-side).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // allow onboarding + settings
      if (pathname.startsWith("/garmin") || pathname.startsWith("/settings") || pathname.startsWith("/login")) return;
      try {
        const res = await fetch("/api/garmin/status", { cache: "no-store" });
        const json = (await res.json()) as { status?: { connected: boolean } };
        const connected = Boolean(json?.status?.connected);
        if (!connected && !cancelled) router.replace("/garmin");
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return (
    <MobileUiProvider value={{ openMenu: () => setMenuOpen(true) }}>
      <div className="min-h-screen">
        <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} userEmail={userEmail} />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)]" />
        <div className="absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500/10 via-sky-500/8 to-fuchsia-500/8 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-5 pb-24 md:px-6 md:pb-5">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-6">
            <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold tracking-tight">Health Trend</div>
              <div className="mt-1 text-xs text-[color:var(--text-tertiary)]">{userEmail}</div>

              <SidebarNav />

              <div className="mt-4 text-xs text-[color:var(--text-caption)]">
                SaaS-style MVP. Fokus: hurtige snapshots, manual kontekst og AI-brief.
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Topbar */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                className="md:hidden mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] text-[color:var(--text-primary)] shadow-sm"
                aria-label="Åbn menu"
                onClick={() => setMenuOpen(true)}
              >
                <span className="text-lg leading-none">≡</span>
              </button>

              <div>
                <div className="text-lg font-semibold tracking-tight">{title}</div>
                {subtitle ? (
                  <div className="text-sm text-[color:var(--text-tertiary)]">{subtitle}</div>
                ) : null}
                {pathname === "/" ? <AiCoachLine /> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-xs text-[color:var(--text-caption)] max-w-[40vw] truncate">
                {userEmail}
              </div>
              <UserMenu userEmail={userEmail} />
            </div>
          </div>

          <NetworkStatusBanner />
          <PullToRefresh>{children}</PullToRefresh>
        </div>
      </div>
    </div>
    </MobileUiProvider>
  );
}

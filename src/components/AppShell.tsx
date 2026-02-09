import { SidebarNav } from "@/components/SidebarNav";

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-white to-white dark:from-neutral-950 dark:via-black dark:to-black" />
        <div className="absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-5 md:px-6">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-6">
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">
              <div className="text-sm font-semibold tracking-tight">Health Trend</div>
              <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">{userEmail}</div>

              <SidebarNav />

              <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                SaaS-style MVP. Fokus: hurtige snapshots, manual kontekst og AI-brief.
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Topbar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold tracking-tight">Dashboard</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                Din sundheds-stream, destilleret.
              </div>
            </div>
            <div className="md:hidden text-xs text-neutral-500 dark:text-neutral-400">
              {userEmail}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

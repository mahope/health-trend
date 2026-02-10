export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getHealth() {
  const base = process.env.BETTER_AUTH_BASE_URL;
  const url = base ? `${base.replace(/\/$/, "")}/api/health` : "http://localhost:3000/api/health";

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as unknown;
    return { ok: true as const, status: res.status, json };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function UptimePage() {
  const health = await getHealth();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="text-xl font-semibold">Uptime</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Minimal status page for quick checks (mobile-friendly).
      </p>

      <div className="mt-4 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">/api/health</div>
          {health.ok ? (
            <span
              className={
                "rounded-full px-2 py-0.5 text-xs font-medium " +
                (health.status === 200 ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900")
              }
            >
              {health.status}
            </span>
          ) : (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-900">
              error
            </span>
          )}
        </div>

        <pre className="mt-3 max-h-[50vh] overflow-auto rounded-xl bg-muted p-3 text-xs leading-relaxed">
          {health.ok ? JSON.stringify(health.json, null, 2) : health.error}
        </pre>

        <p className="mt-3 text-xs text-muted-foreground">
          Tip: bookmark this page. If it loads and shows db.ok=true, the app + database are reachable.
        </p>
      </div>
    </main>
  );
}

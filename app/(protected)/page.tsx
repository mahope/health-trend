import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ymd } from "@/lib/date";
import { ManualForm } from "@/components/ManualForm";
import { AiBriefCard } from "@/components/AiBriefCard";
import { LatestSnapshotCard } from "@/components/LatestSnapshotCard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const day = ymd(new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {day} — logget ind som {session?.user.email}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">Snapshots</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Seneste snapshot + delta ift. forrige (i dag/i går).
          </p>
          <div className="mt-4">
            <LatestSnapshotCard day={day} />
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">Manual</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Hurtig kontekst til AI (symptomer/koffein/alkohol/noter).
          </p>
          <div className="mt-4">
            <ManualForm day={day} />
          </div>
        </div>

        <div className="rounded-xl border p-4 md:col-span-2">
          <h2 className="font-semibold">AI brief</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Generér “sygdom/overbelastning” baseret på snapshots + manual + baseline.
          </p>
          <div className="mt-4">
            <AiBriefCard day={day} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Næste MVP</h2>
        <ul className="mt-2 text-sm text-neutral-600 list-disc pl-5 space-y-1">
          <li>Auto-generate AI brief morgen/aften (job/cron)</li>
          <li>Notifikationer ved MED/HIGH</li>
        </ul>
      </section>
    </div>
  );
}

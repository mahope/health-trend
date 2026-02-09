import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ymd } from "@/lib/date";
import { ManualForm } from "@/components/ManualForm";
import { AiBriefCard } from "@/components/AiBriefCard";
import { LatestSnapshotCard } from "@/components/LatestSnapshotCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const day = ymd(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            {day} — logget ind som {session?.user.email}
          </p>
        </div>

        <div className="hidden md:block text-xs text-neutral-500 dark:text-neutral-400">
          Tip: Tag 2-3 snapshots pr. dag (morgen/middag/aften).
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader
            title="Snapshots"
            description="Seneste snapshot + delta ift. forrige (i dag/i går)."
          />
          <CardBody>
            <LatestSnapshotCard day={day} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader
            title="Manual"
            description="Hurtig kontekst til AI (symptomer/koffein/alkohol/noter)."
          />
          <CardBody>
            <ManualForm day={day} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-12">
          <CardHeader
            title="AI brief"
            description="Generér “sygdom/overbelastning” baseret på snapshots + manual + baseline."
          />
          <CardBody>
            <AiBriefCard day={day} />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

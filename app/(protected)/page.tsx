import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ymd } from "@/lib/date";
import { ManualForm } from "@/components/ManualForm";
import { AiBriefCard } from "@/components/AiBriefCard";
import { LatestSnapshotCard } from "@/components/LatestSnapshotCard";
import { DashboardBelowFold } from "@/components/DashboardBelowFold";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { DashboardActions } from "@/components/DashboardActions";
import { RiskHero } from "@/components/RiskHero";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const day = ymd(new Date());

  const [brief, snapshotCount] = await Promise.all([
    prisma.aiBrief.findUnique({
      where: { userId_day: { userId: session.user.id, day } },
    }),
    prisma.garminSnapshot.count({ where: { userId: session.user.id } }),
  ]);

  const hasAnySnapshots = snapshotCount > 0;

  return (
    <div className="space-y-4">
      <MobileActionBar manualAnchorId="manual" />
      <PageHeader
        title="Dashboard"
        subtitle={`${day} — logget ind som ${session.user.email}`}
        right={
          <div className="hidden md:block">
            <DashboardActions day={day} />
          </div>
        }
      />

      {!hasAnySnapshots ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/40 p-5 text-sm text-neutral-700 dark:border-white/15 dark:bg-black/15 dark:text-neutral-200">
          <div className="font-medium">Start her: tag dit første snapshot</div>
          <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Et snapshot er en lille opsamling af dine Garmin-signaler (søvn, stress, steps, Body Battery osv.). Når du har
            taget ét, kan du begynde at se trends og få AI-brief.
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="#snapshots"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus-visible:ring-white/20"
            >
              Gå til Snapshots
            </Link>
            <Link
              href="#manual"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/10 dark:bg-black/30 dark:text-neutral-100 dark:hover:bg-black/45 dark:focus-visible:ring-white/20"
            >
              + tilføj manual kontekst
            </Link>
          </div>
        </div>
      ) : null}

      <RiskHero
        day={day}
        risk={(brief?.risk as "OK" | "LOW" | "MED" | "HIGH" | undefined) ?? null}
        short={brief?.short ?? null}
        createdAt={brief?.createdAt ?? null}
      />

      <section className="grid gap-4 lg:grid-cols-12">
        <div id="snapshots" className="lg:col-span-5">
          <Card>
            <CardHeader
              title="Snapshots"
              description="Seneste snapshot + delta ift. forrige (i dag/i går)."
            />
            <CardBody>
              <LatestSnapshotCard day={day} />
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <CardHeader
              title="Manual"
              description="Hurtig kontekst til AI (symptomer/koffein/alkohol/noter)."
            />
            <CardBody>
              <ManualForm day={day} />
            </CardBody>
          </Card>
        </div>

        <Card className="lg:col-span-12">
          <CardHeader
            title="AI brief"
            description="Signaler + forslag — genereret fra snapshots, manual og baseline."
          />
          <CardBody>
            <AiBriefCard day={day} />
          </CardBody>
        </Card>
      </section>

      <div id="manual" />

      <DashboardBelowFold days={14} />
    </div>
  );
}

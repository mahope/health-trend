import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ymd } from "@/lib/date";
import { ManualForm } from "@/components/ManualForm";
import { AiBriefCard } from "@/components/AiBriefCard";
import { LatestSnapshotCard } from "@/components/LatestSnapshotCard";
import { TrendsCharts } from "@/components/TrendsCharts";
import { ActivitiesCard } from "@/components/ActivitiesCard";
import { DayPlanCard } from "@/components/DayPlanCard";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { DashboardActions } from "@/components/DashboardActions";
import { RiskHero } from "@/components/RiskHero";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const day = ymd(new Date());

  const brief = await prisma.aiBrief.findUnique({
    where: { userId_day: { userId: session.user.id, day } },
  });

  return (
    <div className="space-y-4">
      <MobileActionBar manualAnchorId="manual" />
      <PageHeader
        title="Dashboard"
        subtitle={`${day} — logget ind som ${session.user.email}`}
        right={<div className="hidden md:block"><DashboardActions day={day} /></div>}
      />

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

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <TrendsCharts days={14} />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <DayPlanCard />
          <ActivitiesCard limit={10} />
        </div>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ymd } from "@/lib/date";
import { ManualForm } from "@/components/ManualForm";
import { AiBriefCard } from "@/components/AiBriefCard";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { DashboardActions } from "@/components/DashboardActions";
import { RiskHero } from "@/components/RiskHero";
import { RecoveryScoreCard } from "@/components/RecoveryScoreCard";
import { EmptyState, InlineEmptyLink } from "@/components/EmptyState";
import { DayPlanCard } from "@/components/DayPlanCard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";

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
        <>
          <EmptyState
            title="Start her: tag dit første snapshot"
            description={
              <>
                Første gang kræver kun 2 ting:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>
                    Der ligger en Garmin eksport for i dag (fx <code>garmin-YYYY-MM-DD.json</code>) — se{" "}
                    <InlineEmptyLink href="/garmin">Garmin</InlineEmptyLink>
                  </li>
                  <li>Du tager dit første snapshot.</li>
                </ol>
                <div className="mt-2">
                  Når du har taget ét snapshot, kan dashboardet begynde at vise trends og lave AI-brief.
                </div>
              </>
            }
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <LinkButton href="/snapshots" variant="primary">
                  Tag første snapshot
                </LinkButton>
                <LinkButton href="/garmin" variant="secondary">
                  Tjek Garmin data
                </LinkButton>
                <LinkButton href="#manual" variant="secondary">
                  + tilføj manual kontekst
                </LinkButton>
              </div>
            }
          />

          <div id="manual" />

          <Card>
            <CardHeader
              title="Manual (valgfrit)"
              description="Hvis du vil, kan du allerede nu notere symptomer/koffein/alkohol — så AI brief har mere kontekst, når første snapshot er taget."
            />
            <CardBody>
              <ManualForm day={day} />
            </CardBody>
          </Card>
        </>
      ) : (
        <>
          {/* Simple dashboard: Today → Plan → Manual → Brief */}
          <section className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <RiskHero
                day={day}
                risk={(brief?.risk as "OK" | "LOW" | "MED" | "HIGH" | undefined) ?? null}
                short={brief?.short ?? null}
                createdAt={brief?.createdAt ?? null}
              />
            </div>
            <div className="lg:col-span-4">
              <RecoveryScoreCard day={day} />
            </div>
          </section>

          <DayPlanCard />

          <div id="manual" />
          <Card>
            <CardHeader title="Manual" description="Hurtig kontekst til AI (symptomer/koffein/alkohol/noter)." />
            <CardBody>
              <ManualForm day={day} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="AI brief" description="Overblik + fold ud for detaljer." />
            <CardBody>
              <AiBriefCard day={day} />
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Link className="underline underline-offset-4" href="/snapshots">Snapshots</Link>
                <Link className="underline underline-offset-4" href="/activities">Aktiviteter</Link>
                <Link className="underline underline-offset-4" href="/insights">Indsigter</Link>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

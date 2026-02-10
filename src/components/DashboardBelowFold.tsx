"use client";

import dynamic from "next/dynamic";
import { DayPlanCard } from "@/components/DayPlanCard";
import { ActivitiesCard } from "@/components/ActivitiesCard";

const TrendsCharts = dynamic(
  () => import("@/components/TrendsCharts").then((m) => m.TrendsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-dashed border-[color:var(--border-dashed)] bg-[color:var(--surface-inset)] p-5 text-sm text-[color:var(--text-secondary)]">
        Indlæser charts…
      </div>
    ),
  },
);

export function DashboardBelowFold({ days = 14 }: { days?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <TrendsCharts days={days} />
      </div>
      <div className="lg:col-span-4 space-y-4">
        <DayPlanCard />
        <ActivitiesCard limit={10} />
      </div>
    </div>
  );
}

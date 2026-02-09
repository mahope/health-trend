"use client";

import dynamic from "next/dynamic";
import { DayPlanCard } from "@/components/DayPlanCard";
import { ActivitiesCard } from "@/components/ActivitiesCard";

const TrendsCharts = dynamic(
  () => import("@/components/TrendsCharts").then((m) => m.TrendsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white/40 p-5 text-sm text-neutral-700 dark:border-white/15 dark:bg-black/15 dark:text-neutral-200">
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

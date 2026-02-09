"use client";

import { InsightsCards } from "@/components/InsightsCards";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function InsightsPage() {
  return (
    <div className="space-y-4">
      <InsightsCards />
      <Card>
        <CardHeader title="Kommer snart" description="Flere små ‘hverdagshacks’ baseret på Garmin." />
        <CardBody>
          <ul className="list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
            <li>HRV (når vi har feltet) + recovery score</li>
            <li>Automatisk planlægning: let/moderat/hård dag</li>
            <li>AI ‘weekly review’ med konkrete forslag</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

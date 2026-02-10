import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Risk = "OK" | "LOW" | "MED" | "HIGH";

function tone(r: Risk) {
  if (r === "HIGH") return "high" as const;
  if (r === "MED") return "med" as const;
  if (r === "LOW") return "low" as const;
  return "ok" as const;
}

export function RiskHero({
  day,
  risk,
  short,
  createdAt,
}: {
  day: string;
  risk: Risk | null;
  short?: string | null;
  createdAt?: Date | null;
}) {
  return (
    <Card>
      <CardHeader
        title="Dagens status"
        description={`Overblik for ${day} (AI + snapshots + manual).`}
        right={
          risk ? (
            <Badge tone={tone(risk)}>
              Risk: {risk}
            </Badge>
          ) : (
            <Badge tone="neutral">Ingen brief endnu</Badge>
          )
        }
      />
      <CardBody>
        <div className="text-sm text-[color:var(--text-primary)]">
          {short?.trim()
            ? short
            : "Generér et brief for at få risiko-vurdering og forslag."}
        </div>
        {createdAt ? (
          <div className="mt-2 text-xs text-[color:var(--text-caption)]">
            Sidst genereret: {createdAt.toLocaleString("da-DK", { hour12: false })}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

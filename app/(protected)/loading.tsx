import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function CardHeaderSkeleton({ right = false }: { right?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 p-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-56" />
      </div>
      {right ? <Skeleton className="h-5 w-14" /> : null}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-5 shadow-sm backdrop-blur">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Main cards (dashboard-like skeleton) */}
      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeaderSkeleton />
          <CardBody>
            <div className="space-y-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3"
                  >
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-2 h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeaderSkeleton right />
          <CardBody>
            <div className="space-y-3">
              <Skeleton className="h-4 w-44" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3"
                  >
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="mt-2 h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeaderSkeleton />
          <CardBody>
            <div className="grid gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-inset)] p-3"
                >
                  <Skeleton className="h-3 w-16" />
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeaderSkeleton />
          <CardBody>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-12">
          <CardHeaderSkeleton />
          <CardBody>
            <div className="space-y-3">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

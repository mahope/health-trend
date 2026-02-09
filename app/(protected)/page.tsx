import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Logget ind som {session?.user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">Snapshots</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Kommer: morgen/middag/aften + delta-visning.
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">AI brief</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Kommer: deterministiske flags + action card.
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">Garmin</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Kommer: Connect flow + token store (krypteret).
        </p>
      </div>
    </div>
  );
}

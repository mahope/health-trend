import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Health Trend</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Logget ind som {session.user.email}
      </p>
      <div className="mt-6 rounded-xl border p-4">
        <p className="text-sm">
          Næste skridt: DB-migration + bootstrap af de 2 users + Garmin connect +
          snapshots.
        </p>
      </div>
    </main>
  );
}

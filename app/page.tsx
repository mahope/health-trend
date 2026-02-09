import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import DashboardPage from "./(protected)/page";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <AppShell userEmail={session.user.email}>
      <DashboardPage />
    </AppShell>
  );
}

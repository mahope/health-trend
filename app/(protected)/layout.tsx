import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { ymd } from "@/lib/date";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const day = ymd(new Date());
  const brief = await prisma.aiBrief.findUnique({
    where: { userId_day: { userId: session.user.id, day } },
    select: { short: true },
  });

  return (
    <AppShell userEmail={session.user.email} coachText={brief?.short ?? null}>
      {children}
    </AppShell>
  );
}

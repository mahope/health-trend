import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold">
              Health Trend
            </Link>
            <nav className="text-sm text-neutral-600 flex items-center gap-3">
              <Link href="/">Dashboard</Link>
              <Link href="/snapshots">Snapshots</Link>
              <Link href="/garmin">Garmin</Link>
              <Link href="/settings">Settings</Link>
            </nav>
          </div>

          <div className="text-sm text-neutral-600">{session.user.email}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

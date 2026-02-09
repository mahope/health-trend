import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return null;
  }
  return session;
}

export async function requireUser() {
  const session = await requireSession();
  if (!session) return null;
  return session.user;
}

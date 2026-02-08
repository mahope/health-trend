import "dotenv/config";

import crypto from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { auth } from "../auth";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function maybeEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v : undefined;
}

function randomPassword(): string {
  // 24 chars, url-safe-ish
  return crypto.randomBytes(18).toString("base64url");
}

async function ensureUser({
  email,
  name,
  password,
  role,
}: {
  email: string;
  name: string;
  password: string;
  role: "admin" | "user";
}) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== role) {
      await prisma.user.update({ where: { email }, data: { role } });
    }
    return { created: false };
  }

  const res = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  const maybeErr = (res as unknown as { error?: { message?: string } }).error;
  if (maybeErr) {
    throw new Error(`signUpEmail failed for ${email}: ${maybeErr.message || "unknown"}`);
  }

  await prisma.user.update({ where: { email }, data: { role } });
  return { created: true };
}

async function main() {
  // Provided by Mads
  const madsEmail = maybeEnv("BOOTSTRAP_MADS_EMAIL") || "Madsholstp@gmail.com";
  const teaEmail = maybeEnv("BOOTSTRAP_TEA_EMAIL") || "Teajensen1212@gmail.com";

  const madsPassword = maybeEnv("BOOTSTRAP_MADS_PASSWORD") || randomPassword();
  const teaPassword = maybeEnv("BOOTSTRAP_TEA_PASSWORD") || randomPassword();

  // Base URL/secret are required for Better Auth to behave sanely
  requireEnv("BETTER_AUTH_SECRET");
  requireEnv("BETTER_AUTH_BASE_URL");

  const out: Array<{ email: string; password: string; created: boolean }> = [];

  out.push({
    email: madsEmail,
    password: madsPassword,
    created: (await ensureUser({
      email: madsEmail,
      name: "Mads",
      password: madsPassword,
      role: "admin",
    })).created,
  });

  out.push({
    email: teaEmail,
    password: teaPassword,
    created: (await ensureUser({
      email: teaEmail,
      name: "Tea",
      password: teaPassword,
      role: "user",
    })).created,
  });

  // Write local (gitignored) file so we don't lose generated passwords.
  const lines = [
    `# Generated ${new Date().toISOString()}`,
    ...out.map((x) => `${x.email}\t${x.password}\tcreated=${x.created}`),
    "",
  ].join("\n");

  await BunLikeWriteFile("./scripts/_bootstrap_passwords.local.txt", lines);

  // Also print (but keep short):
  console.log("Bootstrapped users:");
  for (const x of out) {
    console.log(`- ${x.email} (created=${x.created}) password=${x.password}`);
  }
}

async function BunLikeWriteFile(path: string, content: string) {
  // avoids adding fs/promises import just for this script
  const fs = await import("node:fs/promises");
  await fs.writeFile(path, content, "utf8");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

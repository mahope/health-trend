import "dotenv/config";

import crypto from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "better-auth/crypto";

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
  resetPassword,
}: {
  email: string;
  name: string;
  password: string;
  role: "admin" | "user";
  resetPassword: boolean;
}) {
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Ensure role
    if (existing.role !== role) {
      await prisma.user.update({ where: { id: existing.id }, data: { role } });
    }

    // Ensure credential account exists (password)
    const existingAccount = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });

    const passwordHash = await hashPassword(password);

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: existing.id,
          providerId: "credential",
          accountId: existing.id,
          password: passwordHash,
        },
      });

      return { created: false, passwordReset: true };
    }

    if (resetPassword) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: passwordHash },
      });
      return { created: false, passwordReset: true };
    }

    return { created: false, passwordReset: false };
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      role,
      emailVerified: false,
    },
  });

  const passwordHash = await hashPassword(password);

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: passwordHash,
    },
  });

  return { created: true, passwordReset: true };
}

async function main() {
  // Provided by Mads
  const madsEmail = maybeEnv("BOOTSTRAP_MADS_EMAIL") || "Madsholstp@gmail.com";
  const teaEmail = maybeEnv("BOOTSTRAP_TEA_EMAIL") || "Teajensen1212@gmail.com";

  const madsPassword = maybeEnv("BOOTSTRAP_MADS_PASSWORD") || randomPassword();
  const teaPassword = maybeEnv("BOOTSTRAP_TEA_PASSWORD") || randomPassword();

  // Secret is required (hashing uses WebCrypto + app uses Better Auth)
  requireEnv("BETTER_AUTH_SECRET");
  requireEnv("BETTER_AUTH_BASE_URL");

  const resetPasswords = (maybeEnv("BOOTSTRAP_RESET_PASSWORDS") || "").toLowerCase() === "1";

  const out: Array<{ email: string; password: string; created: boolean; passwordReset: boolean }> = [];

  const madsRes = await ensureUser({
    email: madsEmail,
    name: "Mads",
    password: madsPassword,
    role: "admin",
    resetPassword: resetPasswords,
  });

  out.push({
    email: madsEmail,
    password: madsPassword,
    created: madsRes.created,
    passwordReset: madsRes.passwordReset,
  });

  const teaRes = await ensureUser({
    email: teaEmail,
    name: "Tea",
    password: teaPassword,
    role: "user",
    resetPassword: resetPasswords,
  });

  out.push({
    email: teaEmail,
    password: teaPassword,
    created: teaRes.created,
    passwordReset: teaRes.passwordReset,
  });

  // Write local (gitignored) file so we don't lose generated passwords.
  const lines = [
    `# Generated ${new Date().toISOString()}`,
    ...out.map((x) => `${x.email}\t${x.password}\tcreated=${x.created}\tpasswordReset=${x.passwordReset}`),
    "",
  ].join("\n");

  await BunLikeWriteFile("./scripts/_bootstrap_passwords.local.txt", lines);

  // Also print (but keep short):
  console.log("Bootstrapped users:");
  for (const x of out) {
    console.log(
      `- ${x.email} (created=${x.created}, passwordReset=${x.passwordReset}) password=${x.password}`,
    );
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "better-auth/crypto";
import crypto from "node:crypto";

function randomPassword(): string {
  return crypto.randomBytes(18).toString("base64url");
}

async function ensureUser({
  email,
  name,
  password,
}: {
  email: string;
  name: string;
  password: string;
}) {
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await hashPassword(password);

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existing) {
    // Update password if user exists
    const existingAccount = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: passwordHash },
      });
    } else {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: existing.id,
          providerId: "credential",
          accountId: existing.id,
          password: passwordHash,
        },
      });
    }

    return { user: existing, created: false, password };
  }

  // Create new user
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      emailVerified: false,
    },
  });

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: passwordHash,
    },
  });

  return { user, created: true, password };
}

export async function POST(request: Request) {
  // Only allow first-time setup (check if any users exist)
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    // Users already exist, require auth or return error
    const secret = request.headers.get("x-setup-secret");
    if (secret !== process.env.SETUP_SECRET) {
      return NextResponse.json(
        { error: "Setup already completed. Use /api/auth/sign-in to login." },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const { email, name, password } = body;

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Missing email, name, or password" },
      { status: 400 }
    );
  }

  try {
    const result = await ensureUser({ email, name, password });

    return NextResponse.json({
      ok: true,
      created: result.created,
      email: result.user.email,
      name: result.user.name,
      password: result.password, // Only returned on creation
      message: result.created
        ? "User created successfully"
        : "User already exists, password updated",
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

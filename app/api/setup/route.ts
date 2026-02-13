import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

// Simple hash function (not for production use - just for setup)
// Better Auth will handle proper password verification on login
function simpleHash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
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

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existing) {
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

  // Note: For better-auth, password must be properly hashed
  // This is a placeholder - we'll use better-auth's own sign-up API
  // For now, create account with simple hash (will need password reset)
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: simpleHash(password),
    },
  });

  return { user, created: true, password };
}

export async function POST(request: Request) {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    const secret = request.headers.get("x-setup-secret");
    if (secret !== process.env.SETUP_SECRET) {
      return NextResponse.json(
        { error: "Setup already completed. Use /login to sign in." },
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

  if (password.length < 12) {
    return NextResponse.json(
      { error: "Password must be at least 12 characters" },
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
      message: result.created
        ? "User created successfully. Use password reset if needed."
        : "User already exists",
    });
  } catch (error: unknown) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

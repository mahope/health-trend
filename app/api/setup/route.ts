import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  try {
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      return NextResponse.json({
        ok: true,
        created: false,
        email: existing.email,
        name: existing.name,
        message: "User already exists",
      });
    }

    // Create user only - skip account creation
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        emailVerified: false,
      },
    });

    return NextResponse.json({
      ok: true,
      created: true,
      email: user.email,
      name: user.name,
      message: "User created. You need to set up password via bootstrap script or manually.",
    });
  } catch (error: unknown) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

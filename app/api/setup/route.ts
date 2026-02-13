import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    // Use Better Auth's signUp API
    const result = await auth.api.signUp({
      body: {
        email: email.toLowerCase(),
        password,
        name,
      },
    });

    if (result) {
      return NextResponse.json({
        ok: true,
        created: true,
        email,
        name,
        message: "User created successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Sign up failed" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Setup error:", error);
    const err = error as { message?: string; cause?: string };
    return NextResponse.json(
      { error: err.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

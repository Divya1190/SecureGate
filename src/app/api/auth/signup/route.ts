import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signUpSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password, name } = result.data;

    // Check for existing user — but do NOT reveal if the email exists (S4)
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      // Return identical success response to prevent email enumeration
      return NextResponse.json(
        { message: "If this email is new, a verification link has been sent." },
        { status: 200 }
      );
    }

    // Hash password with 12 salt rounds (S1)
    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        email,
        name: name ?? null,
        password: passwordHash,
        emailVerified: null,
      },
    });

    // TODO (Phase 3): generate verification token & send email via Resend

    return NextResponse.json(
      { message: "If this email is new, a verification link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SIGNUP_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

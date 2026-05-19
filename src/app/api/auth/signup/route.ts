import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signUpSchema } from "@/lib/validations";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password, name } = result.data;

    // S4 - Anti-enumeration: Check for existing user silently
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "If this email is new, a verification link has been sent." },
        { status: 200 }
      );
    }

    // S1 - Hash password with 12 salt rounds
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in inactive/unverified state
    await db.user.create({
      data: {
        email,
        name: name ?? null,
        password: passwordHash,
        emailVerified: null,
      },
    });

    // Generate secure verification token
    const tokenRecord = await generateVerificationToken(email);

    // Send email via Resend (failures are caught and logged inside sendVerificationEmail)
    await sendVerificationEmail(email, name ?? null, tokenRecord.token);

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

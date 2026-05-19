import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const GENERIC_MESSAGE =
  "If an account with that email exists, a reset link has been sent.";

export async function POST(request: NextRequest) {
  // S5 - Rate Limiting: 3 attempts / 15 minutes
  const limitResult = rateLimit(request, 3, 15 * 60 * 1000);
  if (!limitResult.success && limitResult.response) {
    return limitResult.response;
  }

  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email } = result.data;

    // S4 - Anti-enumeration: Check if user exists silently
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // S4 - Return identical success message even if email doesn't exist
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    // Generate token
    const tokenRecord = await generatePasswordResetToken(email);

    // Send reset email via Resend
    await sendPasswordResetEmail(email, user.name, tokenRecord.token);

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

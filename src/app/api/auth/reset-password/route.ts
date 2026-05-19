import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations";
import { consumePasswordResetToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { token, password } = result.data;

    // S3 & S4 - Consume token securely, return generic error if invalid/expired
    const consumeResult = await consumePasswordResetToken(token);
    if (!consumeResult.success || !consumeResult.email) {
      return NextResponse.json(
        { error: "This link is invalid or has expired." },
        { status: 400 }
      );
    }

    // Hash the new password with 12 rounds (S1)
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password in DB
    await db.user.update({
      where: { email: consumeResult.email },
      data: { password: passwordHash },
    });

    return NextResponse.json(
      { message: "Your password has been successfully reset." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

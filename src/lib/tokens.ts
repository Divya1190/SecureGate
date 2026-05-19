import crypto from "crypto";
import { db } from "@/lib/db";

// S2 - Tokens are Cryptographically Random using OS CSPRNG
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function generateVerificationToken(email: string) {
  const token = generateSecureToken();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes (S3)

  // Clean up any existing verification tokens for this email first
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  return await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });
}

export async function consumeVerificationToken(tokenString: string) {
  const tokenRecord = await db.verificationToken.findUnique({
    where: { token: tokenString },
  });

  // S3 - Token lookup checks (exists, not expired)
  if (!tokenRecord || tokenRecord.expires < new Date()) {
    return { success: false, email: null };
  }

  // Delete immediately to enforce single-use (S3)
  await db.verificationToken.delete({
    where: { token: tokenString },
  });

  return { success: true, email: tokenRecord.identifier };
}

export async function generatePasswordResetToken(email: string) {
  const token = generateSecureToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour (S3)

  // Clean up any existing password reset tokens for this email first
  await db.passwordResetToken.deleteMany({
    where: { email },
  });

  return await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });
}

export async function consumePasswordResetToken(tokenString: string) {
  const tokenRecord = await db.passwordResetToken.findUnique({
    where: { token: tokenString },
  });

  // S3 - Token lookup checks (exists, not expired)
  if (!tokenRecord || tokenRecord.expires < new Date()) {
    return { success: false, email: null };
  }

  // Delete immediately to enforce single-use (S3)
  await db.passwordResetToken.delete({
    where: { token: tokenString },
  });

  return { success: true, email: tokenRecord.email };
}

import { Resend } from "resend";
import VerificationEmail from "@/components/email/VerificationEmail";
import PasswordResetEmail from "@/components/email/PasswordResetEmail";
import React from "react";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || "re_dummy");
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "SecureGate <onboarding@resend.dev>";

export async function sendVerificationEmail(
  email: string,
  name: string | null,
  token: string
) {
  const url = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  try {
    const resend = getResend();
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify your email address - SecureGate",
      react: React.createElement(VerificationEmail, { name, url }),
    });
    return { success: true, data };
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string | null,
  token: string
) {
  const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  try {
    const resend = getResend();
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your password - SecureGate",
      react: React.createElement(PasswordResetEmail, { name, url }),
    });
    return { success: true, data };
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
    return { success: false, error };
  }
}

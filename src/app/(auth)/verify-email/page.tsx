import Link from "next/link";
import { consumeVerificationToken } from "@/lib/tokens";
import { db } from "@/lib/db";

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const token = params.token;

  let verified = false;

  if (token) {
    const result = await consumeVerificationToken(token);
    if (result.success && result.email) {
      await db.user.update({
        where: { email: result.email },
        data: { emailVerified: new Date() },
      });
      verified = true;
    }
  }

  return (
    <div className="auth-card">
      {verified ? (
        <>
          <h1 style={{ color: "var(--success)" }}>Account verified!</h1>
          <p className="subtitle">
            Your email has been successfully verified. You can now log in to your account.
          </p>
          <Link href="/login" className="btn-primary">
            Go to Login
          </Link>
        </>
      ) : (
        <>
          <h1 style={{ color: "var(--danger)" }}>Verification failed</h1>
          <p className="subtitle">This link is invalid or has expired.</p>
          <Link href="/signup" className="btn-primary">
            Back to Sign Up
          </Link>
        </>
      )}
    </div>
  );
}

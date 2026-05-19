import Link from "next/link";

export default function VerifyEmailPromptPage() {
  return (
    <div className="auth-card">
      <h1>Verify your email</h1>
      <p className="subtitle">
        Your email address has not been verified yet. Please check your inbox for
        the verification link we sent you.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Link href="/login" className="btn-primary">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

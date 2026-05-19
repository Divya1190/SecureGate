"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSuccessMessage(data.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="auth-card">
        <h1>Check your email</h1>
        <p className="subtitle">{successMessage}</p>
        <Link href="/login" className="btn-primary">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>Forgot password</h1>
      <p className="subtitle">Enter your email to receive a password reset link.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={!!error}
          />
          {error && <span className="field-error">{error}</span>}
        </div>

        <button
          id="forgot-submit"
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? "Sending link…" : "Send reset link"}
        </button>
      </form>

      <p className="auth-link">
        <Link href="/login">Back to Login</Link>
      </p>
    </div>
  );
}

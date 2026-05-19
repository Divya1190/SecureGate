"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score === 2) return { score, label: "Fair", color: "#f97316" };
  if (score === 3) return { score, label: "Good", color: "#eab308" };
  return { score, label: "Strong", color: "#22c55e" };
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const strength = getStrength(form.password);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="auth-card">
        <h1>Check your email</h1>
        <p className="subtitle">We sent a verification link to <strong>{form.email}</strong>. Click the link to activate your account.</p>
        <Link href="/login" className="btn-primary">Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>Create an account</h1>
      <p className="subtitle">SecureGate — Identity done right.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="name">Name <span className="optional">(optional)</span></label>
          <input id="name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoComplete="name" />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} autoComplete="email" aria-invalid={!!errors.email} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} autoComplete="new-password" aria-invalid={!!errors.password} />
          {form.password && (
            <div className="strength-bar-wrap">
              <div className="strength-bar">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="strength-segment" style={{ background: strength.score >= i ? strength.color : "#374151" }} />
                ))}
              </div>
              <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} autoComplete="new-password" aria-invalid={!!errors.confirmPassword} />
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
        </div>

        {serverError && <p className="server-error">{serverError}</p>}

        <button id="signup-submit" type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-link">Already have an account? <Link href="/login">Log in</Link></p>
    </div>
  );
}

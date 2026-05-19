---
trigger: always_on
---

## S1 — Passwords are Always Hashed with bcrypt, 12 Rounds

```typescript
import bcrypt from "bcryptjs";

// On sign-up and password reset only:
const hash = await bcrypt.hash(password, 12);

// On login only:
const isValid = await bcrypt.compare(submittedPassword, storedHash);
```

12 salt rounds is the project standard. Never use 10 (too weak). Never use SHA-256, MD5, or any non-adaptive hash for passwords. bcrypt is slow by design — that is the point.

## S2 — Tokens are Cryptographically Random

```typescript
import crypto from "crypto";

const token = crypto.randomBytes(32).toString("hex"); // 64-character hex string
```

Never use `Math.random()`, UUIDs, or sequential IDs as security tokens. `crypto.randomBytes` uses the OS CSPRNG.

## S3 — All Tokens Expire and are Single-Use

Every token stored in the database must have:
- `expires: DateTime` — set at creation. Verification: 15 minutes. Password reset: 1 hour.
- Deleted or marked used immediately after it is consumed.

Token lookup must check all three conditions:
1. Token exists
2. `expires` is in the future (`expires > new Date()`)
3. Token has not already been used (delete it on use, or check a `usedAt` field)

If any condition fails, return the same error regardless of which one failed.

## S4 — Error Messages Never Leak Information

These three facts must never be inferable from any API response:
- Whether an email address exists in the database
- Whether a password was wrong versus the email was wrong
- Whether a token is expired versus never existed

**Login:** Always return `"Invalid email or password."` — never `"Email not found"` or `"Wrong password"`.
**Forgot password:** Always return `"If an account with that email exists, a reset link has been sent."` — even if the email is not in the database, no user is created, no email is sent, same response.
**Token validation:** Always return `"This link is invalid or has expired."` — never distinguish between expired and non-existent.

## S5 — Rate Limiting on Sensitive Endpoints

Rate limiting must be applied as middleware before any auth logic runs.

| Endpoint | Limit | Window | Response |
|---|---|---|---|
| `POST /api/auth/signin` | 5 attempts | 10 minutes per IP | 429 + Retry-After header |
| `POST /api/auth/forgot-password` | 3 attempts | 15 minutes per IP | 429 + Retry-After header |
| Resend verification | 3 attempts | 15 minutes per IP | 429 + Retry-After header |

The rate-limited response must not return faster than a normal failed request. Constant-time behaviour is the target.

## S6 — Session Cookies are Locked Down

NextAuth session cookies must be configured with:
- `httpOnly: true` — not accessible via JavaScript
- `secure: true` in production — HTTPS only
- `sameSite: "lax"` — CSRF protection baseline

These are NextAuth defaults in production. Do not override them to be permissive.

## S7 — CSRF Protection on State-Changing Requests

Logout must be a `POST` request, never a `GET` link. A GET link for logout can be triggered by a third-party site embedding an `<img>` tag pointing at your logout URL.

NextAuth provides CSRF token handling by default. Do not disable it.

## S8 — HTTP Security Headers

Add the following headers in `next.config.js`:

```javascript
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

## S9 — No Secrets in Source Code

The following must never appear in any committed file:
- Actual values of `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `DATABASE_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Any bearer token, API key, or connection string

`.env.local` must be in `.gitignore` before the first commit. Verify with `git status` — it must not appear as an untracked file before pushing.

A `.env.example` file with empty placeholder values must be committed.

## S10 — Input Trust Boundary

The server trusts nothing from the client. Every value that arrives in a request body, query string, or header is untrusted until validated.

- All request bodies validated with Zod before use.
- Email addresses normalised to lowercase before any DB lookup or storage.
- No user-supplied values interpolated directly into strings used as DB queries (Prisma parameterises by default — do not use raw queries without `Prisma.sql` tagged templates).
- File paths and redirect URLs derived from user input must be validated against an allowlist.

## S11 — Kerckhoffs's Principle

Security must not depend on the secrecy of the implementation. The strength of SecureGate must come from:
- The computational cost of bcrypt (salt rounds = 12)
- The unpredictability of `crypto.randomBytes` tokens
- The correct use of secrets stored only in environment variables

If the entire source code were made public, the system must remain secure. This is the standard.

## S12 — Murphy's Law is a Threat Model

Assume every edge case will be hit by a real user. Build protection for:
- Tokens that arrive after they have expired
- The same reset link clicked twice
- Login attempts far in excess of normal usage
- Forms submitted with missing or malformed fields
- Users who delete their own session cookies mid-flow
- Concurrent requests that might race on token creation or validation

Every gap left open is a gap that will be found.

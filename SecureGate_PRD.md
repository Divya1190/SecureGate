# SecureGate — Product Requirements Document

**Version:** 1.0
**Date:** 19 May 2026
**Status:** Draft
**Author:** Engineering Team

---

## 1. Purpose and Context

SecureGate is a standalone, production-ready authentication system built as a Next.js application. It is not a full product. It is the identity and access management layer that would sit at the foundation of any serious application — extracted, isolated, and built to the highest standard.

The purpose of this project is singular: demonstrate deep mastery of authentication and security engineering using Next.js, TypeScript, Prisma, and PostgreSQL. Every feature must be implemented with zero shortcuts, following the principle that auth is the one thing you cannot afford to get wrong.

---

## 2. Goals and Non-Goals

### Goals

- Build a complete, working authentication flow from sign-up through logout with no placeholder logic.
- Implement email verification and password reset using real transactional emails via Resend.
- Enforce security at every layer: hashed passwords, expiring tokens, rate limiting, non-leaky error messages, and airtight redirect logic.
- Use NextAuth for session management with a Prisma-backed PostgreSQL database as the single source of truth.
- Produce code that could be dropped into a production application without modification.

### Non-Goals

- This is not a full product. There is no onboarding wizard, billing, admin panel, or multi-tenancy.
- No OAuth or social login providers. Email and password only.
- No role-based access control beyond the binary of authenticated-and-verified versus not.
- No frontend design system. UI should be clean and functional, not polished for a launch.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Auth Library | NextAuth.js (v4 or v5) |
| ORM | Prisma |
| Database | PostgreSQL |
| Email Service | Resend |
| Password Hashing | bcrypt |
| Rate Limiting | Custom middleware (in-memory or Redis-backed) |
| Deployment | Any Node.js host (Vercel, Railway, or local) |

---

## 4. Data Model

### 4.1 User Table

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | Primary key, auto-generated | Prisma `@default(uuid())` |
| email | String | Unique, not null | Normalised to lowercase before storage |
| passwordHash | String | Not null | bcrypt hash, never store plaintext |
| name | String | Optional | Display name |
| emailVerified | DateTime | Nullable | Null until the user verifies; set to timestamp on verification |
| createdAt | DateTime | Auto-set | `@default(now())` |
| updatedAt | DateTime | Auto-updated | `@updatedAt` |

### 4.2 Verification Token Table

Used for both email verification and password reset flows.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | Primary key | |
| token | String | Unique, not null | Cryptographically random, 64-character hex string |
| type | Enum | `EMAIL_VERIFICATION` or `PASSWORD_RESET` | Distinguishes the two flows |
| userId | UUID | Foreign key → User.id | |
| expiresAt | DateTime | Not null | Email verification: 24 hours. Password reset: 1 hour |
| usedAt | DateTime | Nullable | Set on use to prevent replay |
| createdAt | DateTime | Auto-set | |

### 4.3 Session and Account Tables

Managed by NextAuth's Prisma adapter. Follow the NextAuth Prisma schema exactly for Session, Account, and VerificationToken (NextAuth's own table, separate from the custom one above).

---

## 5. Feature Specifications

### 5.1 Sign Up

**Route:** `/signup`
**Method:** `POST /api/auth/signup`

**Functional Requirements:**

- Form collects email, name (optional), password, and confirm password.
- Client-side validation runs before submission: required fields, email format, password match, minimum password length of 8 characters.
- A real-time password strength indicator is displayed below the password field. It evaluates length, character diversity (uppercase, lowercase, digits, symbols), and common patterns. It shows a visual bar with four levels: Weak, Fair, Good, Strong.
- On submission, the server normalises the email to lowercase, checks for an existing account with that email, hashes the password with bcrypt (minimum 12 salt rounds), creates the User record with `emailVerified` set to null, generates a verification token (64-character hex, SHA-256 of `crypto.randomBytes(32)`), stores it in the VerificationToken table with a 24-hour expiry, and sends a verification email via Resend containing a link in the format `{BASE_URL}/verify-email?token={token}`.
- On success, the user is redirected to a confirmation page that says "Check your email to verify your account."
- If the email already exists, the server must not reveal this. It returns the same success message and page. Internally, no duplicate is created. This prevents email enumeration attacks.

**Error Handling:**

- Validation errors are shown inline next to the relevant field.
- Server errors return a generic "Something went wrong. Please try again." message. No stack traces, no field-specific server errors that leak information.

---

### 5.2 Email Verification

**Route:** `/verify-email?token={token}`
**Method:** `GET /api/auth/verify-email?token={token}`

**Functional Requirements:**

- When the user clicks the link from their email, the app looks up the token in the VerificationToken table.
- The token is valid only if: it exists, its type is `EMAIL_VERIFICATION`, `expiresAt` is in the future, and `usedAt` is null.
- If valid: set the User's `emailVerified` to the current timestamp, set the token's `usedAt` to the current timestamp, and redirect to the login page with a success message ("Email verified. You can now log in.").
- If invalid or expired: show a page that says "This verification link is invalid or has expired." with a link to request a new one.
- A "Resend verification email" mechanism must exist, accessible from the login page for users who have not yet verified. It generates a new token (invalidating the old one by checking `usedAt` or deleting it) and sends a new email. This endpoint must also be rate limited.

---

### 5.3 Login

**Route:** `/login`
**Method:** Handled via NextAuth `signIn("credentials", ...)`

**Functional Requirements:**

- Form collects email and password.
- Client-side validation: both fields are required, email format is valid.
- On submission, NextAuth's Credentials provider runs server-side: look up the user by normalised email, compare the submitted password against `passwordHash` using `bcrypt.compare`, and verify that `emailVerified` is not null.
- If all checks pass, a session is created and the user is redirected to `/dashboard`.
- If any check fails — wrong email, wrong password, or unverified email — the response is always the same generic message: "Invalid email or password." The system must never indicate which field was wrong, whether the account exists, or whether the email is unverified. This is non-negotiable for security.
- Exception to the above: if the account exists but email is unverified, it is acceptable to show "Please verify your email before logging in" only if you have determined this does not create an enumeration risk in your implementation. If in doubt, use the generic message.

**Session Configuration:**

- Session strategy: JWT (stateless) or database sessions. Document the choice and the trade-off.
- Session max age: 24 hours.
- Session includes: `user.id`, `user.email`, `user.name`, `user.emailVerified`.

---

### 5.4 Protected Dashboard

**Route:** `/dashboard`

**Functional Requirements:**

- This page is only accessible to users who are both authenticated (have a valid session) and verified (have a non-null `emailVerified`).
- If a user is not authenticated, they are redirected to `/login` with no flash of protected content.
- If a user is authenticated but not verified, they are redirected to a page telling them to verify their email.
- The dashboard displays the user's name, email, and verification status. It also provides a logout button.
- Protection must be enforced server-side using NextAuth's `getServerSession` (App Router) or middleware. Client-side checks alone are not acceptable. Both layers can be used together, but the server-side check is the source of truth.

**Redirect Logic:**

- `/dashboard` → not authenticated → `/login?callbackUrl=/dashboard`
- `/dashboard` → authenticated but not verified → `/verify-email-prompt`
- `/login` → already authenticated and verified → `/dashboard`
- `/signup` → already authenticated and verified → `/dashboard`

---

### 5.5 Forgot Password

**Route:** `/forgot-password`
**Method:** `POST /api/auth/forgot-password`

**Functional Requirements:**

- Form collects the user's email address.
- On submission, the server looks up the user by normalised email. If found, it generates a password reset token (same format as verification token: 64-character hex), stores it in the VerificationToken table with type `PASSWORD_RESET` and a 1-hour expiry, and sends a reset email via Resend containing a link in the format `{BASE_URL}/reset-password?token={token}`.
- If the email is not found, the server returns the same success response: "If an account with that email exists, a reset link has been sent." This prevents enumeration.
- Any existing unused reset tokens for the same user should be invalidated (set `usedAt` or delete them) before creating a new one.

**Reset Password Page:**

**Route:** `/reset-password?token={token}`
**Method:** `POST /api/auth/reset-password`

- The page validates the token server-side on load. If invalid or expired, show an error message with a link back to `/forgot-password`.
- If valid, show a form with "New password" and "Confirm new password" fields, with the same password strength indicator used on sign-up.
- On submission: re-validate the token, hash the new password with bcrypt (12 salt rounds), update the user's `passwordHash`, set the token's `usedAt`, and redirect to `/login` with a success message ("Password reset successfully. You can now log in.").
- After a successful reset, all existing sessions for that user should be invalidated if using database sessions. If using JWT, document this limitation (JWT sessions cannot be individually revoked without a deny list).

---

### 5.6 Rate Limiting

**Scope:** Login endpoint (`/api/auth/callback/credentials` or the custom login API route), forgot-password endpoint, and resend-verification endpoint.

**Functional Requirements:**

- Rate limiting middleware must run before the auth logic executes.
- Strategy: sliding window or fixed window, keyed by IP address.
- Limits: login allows a maximum of 5 attempts per IP per 15-minute window. Forgot-password allows a maximum of 3 requests per IP per 15-minute window. Resend-verification allows a maximum of 3 requests per IP per 15-minute window.
- When the limit is exceeded, the server returns HTTP 429 with a response body: `{ "error": "Too many requests. Please try again later." }` and a `Retry-After` header indicating seconds until the window resets.
- Implementation can use an in-memory store (such as a `Map` with TTL cleanup) for simplicity, or Redis for persistence across restarts. The choice must be documented with the trade-off noted (in-memory resets on deploy, Redis survives restarts but adds infrastructure).
- Rate limiting must not leak timing information. The response time for a rate-limited request should not differ noticeably from a normal failed login.

---

### 5.7 Logout

**Method:** `POST /api/auth/signout` (NextAuth) or custom handler.

**Functional Requirements:**

- Triggered by the logout button on the dashboard.
- The session is destroyed server-side. If using database sessions, the session record is deleted. If using JWT, the session cookie is cleared.
- After logout, the user is redirected to `/login`.
- The logout action must be a POST request (not a GET link) to prevent CSRF-driven logouts.
- After logout, pressing the browser back button must not show the dashboard. The server-side session check on `/dashboard` handles this — there is no cached authenticated state.

---

### 5.8 Password Hashing

**Library:** bcrypt

**Requirements:**

- Salt rounds: minimum 12. This is a deliberate choice balancing security and performance. Do not use 10 (the common default); 12 provides meaningfully more resistance to brute force. Do not exceed 14 unless benchmarked, as hash time doubles with each round.
- Passwords are hashed with `bcrypt.hash(password, 12)` on sign-up and on password reset.
- Passwords are compared with `bcrypt.compare(submittedPassword, storedHash)` on login. Timing-safe comparison is built into bcrypt.compare.
- Plaintext passwords must never be logged, stored, or included in error messages. Ensure no ORM debug mode or request logger captures the password field.

---

## 6. Security Requirements

These are not optional enhancements. They are baseline requirements for a production auth system.

| Requirement | Implementation |
|---|---|
| No password logging | Ensure password fields are excluded from all request logs, ORM debug output, and error tracking. |
| Generic error messages | Login, sign-up, and forgot-password endpoints must never reveal whether an email exists in the system. |
| Token expiry | Verification tokens expire in 24 hours. Reset tokens expire in 1 hour. Expired tokens are rejected, not silently renewed. |
| Single-use tokens | Every token has a `usedAt` field. Once used, it cannot be reused. Check `usedAt IS NULL` on every token lookup. |
| CSRF protection | NextAuth provides CSRF tokens by default. Verify this is active. Logout must be POST-only. |
| Secure cookies | Session cookies must use `httpOnly`, `secure` (in production), and `sameSite: lax` at minimum. |
| HTTPS only (production) | All token links in emails must use HTTPS in production. The `BASE_URL` environment variable must enforce this. |
| No timing leaks | Use bcrypt.compare (constant-time) for password checks. Rate-limited responses should not return faster than normal failures. |
| Input sanitisation | All user inputs are validated and sanitised before database queries. Prisma parameterises queries by default, but validate on the application layer as well. |
| Password requirements | Minimum 8 characters. No maximum below 128 characters (do not artificially limit password length). |

---

## 7. Pages and Routes Summary

| Route | Type | Auth Required | Purpose |
|---|---|---|---|
| `/signup` | Page | No (redirect if authed) | Account creation form |
| `/login` | Page | No (redirect if authed) | Login form |
| `/verify-email` | Page | No | Handles token from email link |
| `/verify-email-prompt` | Page | Yes (authed, not verified) | Tells user to check their email |
| `/forgot-password` | Page | No | Request a password reset |
| `/reset-password` | Page | No | Submit a new password with token |
| `/dashboard` | Page | Yes (authed + verified) | Protected user dashboard |
| `/api/auth/signup` | API | No | Handles sign-up logic |
| `/api/auth/verify-email` | API | No | Handles email verification |
| `/api/auth/forgot-password` | API | No | Handles reset request |
| `/api/auth/reset-password` | API | No | Handles password update |
| `/api/auth/[...nextauth]` | API | — | NextAuth catch-all (login, logout, session) |

---

## 8. Email Templates

Two transactional emails are sent via the Resend SDK. Both must be plain, professional, and functional.

### 8.1 Email Verification

- **Subject:** "Verify your SecureGate account"
- **Body:** "Click the link below to verify your email address. This link expires in 24 hours. {verification_link}. If you did not create this account, you can ignore this email."

### 8.2 Password Reset

- **Subject:** "Reset your SecureGate password"
- **Body:** "Click the link below to reset your password. This link expires in 1 hour. {reset_link}. If you did not request this, you can ignore this email. Your password will not change until you create a new one."

---

## 9. Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/securegate` |
| `NEXTAUTH_SECRET` | Secret for signing JWTs and cookies | 64-character random hex |
| `NEXTAUTH_URL` | Canonical app URL | `http://localhost:3000` (dev) or `https://securegate.example.com` (prod) |
| `RESEND_API_KEY` | Resend API key for sending emails | `re_...` |
| `EMAIL_FROM` | Sender address for transactional emails | `noreply@securegate.example.com` |

---

## 10. Acceptance Criteria

Each feature must satisfy every criterion listed below to be considered complete. These are written as testable pass/fail checks.

### Sign Up
- A new user can create an account with a valid email and password.
- Password strength indicator updates in real time as the user types.
- Submitting a duplicate email does not reveal the account exists; the user sees the same confirmation page.
- The password is stored as a bcrypt hash with 12 salt rounds, never as plaintext.
- A verification email is sent via Resend within 10 seconds of sign-up.

### Email Verification
- Clicking a valid, unexpired token link sets `emailVerified` on the user and redirects to login.
- Clicking an expired or already-used token shows an error and a resend option.
- A token cannot be used twice.

### Login
- A verified user can log in with correct credentials and is redirected to the dashboard.
- An incorrect password or non-existent email returns "Invalid email or password."
- An unverified user cannot log in (or receives a prompt to verify — see 5.3).
- After 5 failed attempts from the same IP within 15 minutes, further attempts return HTTP 429.

### Protected Dashboard
- An unauthenticated user visiting `/dashboard` is redirected to `/login`.
- An authenticated but unverified user is redirected to `/verify-email-prompt`.
- An authenticated and verified user sees the dashboard with their name and email.

### Forgot Password
- Submitting a registered email sends a reset link via Resend.
- Submitting an unregistered email returns the same success message (no enumeration).
- The reset token expires after 1 hour.
- After resetting, the old password no longer works and the new one does.
- A used reset token cannot be reused.

### Rate Limiting
- The 6th login attempt from the same IP within 15 minutes returns 429.
- The 4th forgot-password request from the same IP within 15 minutes returns 429.
- The `Retry-After` header is present on 429 responses.

### Logout
- Clicking logout destroys the session and redirects to `/login`.
- After logout, navigating to `/dashboard` redirects to `/login`.
- Logout is triggered via POST, not GET.

---

## 11. Out of Scope

The following are explicitly excluded from this project to maintain focus.

- OAuth and social login (Google, GitHub, etc.)
- Multi-factor authentication (TOTP, SMS, WebAuthn)
- Role-based or attribute-based access control
- User profile editing (beyond what the dashboard shows)
- Admin interface or user management
- Internationalisation (i18n)
- Comprehensive UI/UX design or design system
- Deployment automation, CI/CD pipelines, or infrastructure-as-code
- Audit logging (desirable but out of scope for this iteration)

---

## 12. Engineering Principles

This project is a deliberate exercise in disciplined engineering. The following principles apply to every line of code.

**Secure by default.** Every endpoint assumes hostile input. Tokens expire. Errors are generic. Passwords are hashed. Cookies are locked down. There is no "we will add security later."

**No dead code.** Every file, function, and import must be in use. If it is not needed, it is deleted.

**Explicit over implicit.** Configuration is documented. Magic numbers are named constants. Environment variables have a table and a `.env.example` file.

**Fail closed.** If a session check fails for any reason — expired, corrupted, missing — the user is treated as unauthenticated. The default state is "access denied."

**Test the unhappy path.** The interesting behaviour of an auth system is what happens when things go wrong: expired tokens, brute-force attempts, duplicate emails, tampered cookies. These paths must work correctly, not just the happy path.

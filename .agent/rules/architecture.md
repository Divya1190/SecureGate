---
trigger: always_on
---

## A1 — App Router Only

Use Next.js 14 App Router exclusively. No Pages Router. No mixing of the two paradigms.
- All routes live under `src/app/`
- API routes use `route.ts` with named exports (`GET`, `POST`, etc.)
- Server components are the default. Add `"use client"` only when the component needs browser APIs, state, or event handlers.

## A2 — Single Prisma Client Instance

Never instantiate `new PrismaClient()` more than once. Use the singleton pattern in `src/lib/db.ts`.

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

Never log `query` in development — it will print parameter values including passwords to the console.

## A3 — Zod Validates Everything

Every API route that receives a request body must define and apply a Zod schema before any database call.
If Zod validation fails, return 400 immediately. Never pass unvalidated data to Prisma.

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const result = schema.safeParse(await request.json());
if (!result.success) {
  return NextResponse.json({ error: "Invalid input" }, { status: 400 });
}
```

## A4 — NextAuth is the Session Authority

NextAuth is the only place where sessions are created or destroyed.
- Never manually set or clear session cookies.
- Use `getServerSession(authOptions)` on the server to check auth state.
- Use `useSession()` on the client for display purposes only — never for access control.
- Access control decisions must always be made server-side.

## A5 — Middleware Protects Routes

`middleware.ts` in the project root is the first line of protection for all routes under `/dashboard`.
It must redirect unauthenticated users to `/login` before any page component renders.
Never rely on client-side redirect logic as the only protection for a protected route.

```typescript
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

The server-side session check inside the page component is the second layer. Both must be present.

## A6 — Lib Folder is the Business Logic Layer

No business logic in page components or route handlers directly. Extract reusable logic to `src/lib/`.

| File | Responsibility |
|---|---|
| `src/lib/auth.ts` | NextAuth config and authOptions |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/email.ts` | Resend send functions |
| `src/lib/tokens.ts` | Token generation and validation |
| `src/lib/rate-limit.ts` | Rate limiter initialisation |
| `src/lib/validations.ts` | All Zod schemas |

Route handlers call lib functions. They do not contain raw Prisma queries or crypto logic.

## A7 — Email Templates are Components

All email HTML lives in `src/components/email/` as React Email components.
Never construct email HTML strings inline in API route handlers.

## A8 — TypeScript Strict Mode

`tsconfig.json` must have `"strict": true`. No `any` types unless the third-party library forces it and it is annotated with a comment explaining why.

## A9 — Environment Variables are Typed

Create `src/lib/env.ts` that reads and validates all required environment variables at startup.
If a required variable is missing, the app must throw at startup, not fail silently at runtime.

```typescript
const requiredVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
] as const;

for (const v of requiredVars) {
  if (!process.env[v]) throw new Error(`Missing environment variable: ${v}`);
}
```

## A10 — Phase Discipline

Code is written in phase order. Phase 1 must be complete and committed before Phase 2 begins.
Each phase has one commit minimum on GitHub. Commit message format: `phase/N: description`.
Example: `phase/2: add NextAuth credentials provider and signup route`
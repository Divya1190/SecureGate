## Skill: api-route-scaffolder

**Trigger:** When a new API route needs to be created in `src/app/api/`.

**Purpose:** Scaffold every new API route consistently — with validation, auth checking, error handling, and rate limiting — so no route is ever a security gap.

### Steps

**Step 1 — Determine the route requirements**

Before writing code, answer:
1. Does this route require authentication? (Yes → add session check at the top)
2. Does this route accept user input? (Yes → define a Zod schema)
3. Is this route a sensitive endpoint (auth, password, token)? (Yes → apply rate limiting)
4. What HTTP methods does it handle? (Define only those — reject others with 405)

**Step 2 — Create the route file**

```
src/app/api/<feature>/<action>/route.ts
```

Examples:
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/payments/initiate/route.ts`

**Step 3 — Apply the standard route template**

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
// import { rateLimiter } from "@/lib/rate-limit"; // uncomment if rate-limited

// Step 1: Define Zod schema
const schema = z.object({
  email: z.string().email(),
  // add other fields here
});

export async function POST(request: Request) {
  try {
    // Step 2: Rate limit check (remove if not applicable)
    // const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    // const { success } = await rateLimiter.limit(ip);
    // if (!success) {
    //   return NextResponse.json(
    //     { error: "Too many requests. Please try again later." },
    //     { status: 429, headers: { "Retry-After": "600" } }
    //   );
    // }

    // Step 3: Auth check (remove if route is public)
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    // }

    // Step 4: Parse and validate input
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email } = result.data;

    // Step 5: Business logic
    // ... your logic here ...

    // Step 6: Return success
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    // Step 7: Generic error — never leak details
    console.error("[ROUTE_NAME_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Reject all other methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
```

**Step 4 — Rate limiting setup**

If the route is rate-limited, configure the limiter in `src/lib/rate-limit.ts`:

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 requests per 10 minutes
  prefix: "securegate:login",
});

export const forgotPasswordRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "15 m"),
  prefix: "securegate:forgot-password",
});
```

**Step 5 — Security checklist for every new route**

Before marking the route complete, verify:

- [ ] Zod schema covers all accepted fields — extra fields are stripped
- [ ] Auth check is present if the route touches user-specific data
- [ ] Rate limiter is applied if the route is called on unauthenticated user actions
- [ ] Error messages are generic — no field-level server errors that leak information
- [ ] No `console.log` that prints user passwords, tokens, or API keys
- [ ] `catch` block logs the error server-side (for debugging) but returns a generic message to the client
- [ ] Only the HTTP methods this route supports are exported — all others return 405

**Step 6 — Naming convention for console error logs**

Use a consistent prefix so errors are easy to find in Vercel logs:

```typescript
console.error("[SIGNUP_ERROR]", error);
console.error("[FORGOT_PASSWORD_ERROR]", error);
console.error("[RESET_PASSWORD_ERROR]", error);
console.error("[VERIFY_EMAIL_ERROR]", error);
```

Never log the full request body. It may contain passwords.

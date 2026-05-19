## Skill: flutterwave

**Trigger:** When asked to integrate Flutterwave payment processing into SecureGate (e.g. a premium dashboard feature).

**Purpose:** Add payment capability to the authenticated system correctly, safely, and in a way that applies all of SecureGate's existing security principles.

**Note:** This skill is not in scope for the current assessment. It is included because Engineering Law Q15 asks you to reason about what adding Flutterwave would require. Build this only if explicitly asked.

### Prerequisites before touching payment code

- Phase 1–5 of SecureGate must be fully complete and verified.
- User must be both authenticated and email-verified to reach any payment flow.
- Add `FLUTTERWAVE_PUBLIC_KEY`, `FLUTTERWAVE_SECRET_KEY`, and `FLUTTERWAVE_ENCRYPTION_KEY` to `.env.local` and Vercel dashboard.
- Never use Flutterwave's secret key client-side. It only ever lives in server-side API routes.

### New environment variables

```
FLUTTERWAVE_PUBLIC_KEY
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_ENCRYPTION_KEY
```

### Steps

**Step 1 — Add a payments table**

Run the `db-migration-runner` skill after adding this model:

```prisma
model Payment {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  amount         Int      // Store in kobo/pesewas (smallest unit) — never floats
  currency       String   @default("GHS")
  status         String   @default("pending") // pending | success | failed
  flwRef         String?  @unique            // Flutterwave reference
  txRef          String   @unique            // Your own reference — generated before charge
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Step 2 — Generate a unique transaction reference before initiating payment**

Never let the client generate the transaction reference. Generate it server-side.

```typescript
// src/lib/payments.ts
import crypto from "crypto";

export function generateTxRef(userId: string): string {
  const random = crypto.randomBytes(8).toString("hex");
  return `securegate-${userId}-${random}`;
}
```

Create a `Payment` record in the DB with `status: "pending"` and the `txRef` before sending the user to Flutterwave. This gives you a record to reconcile against the webhook.

**Step 3 — Initiate payment from a server-side API route**

```typescript
// POST /api/payments/initiate
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTxRef } from "@/lib/payments";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const txRef = generateTxRef(session.user.id);

  await db.payment.create({
    data: {
      userId: session.user.id,
      amount: 5000, // e.g. GHS 50.00 = 5000 pesewas
      currency: "GHS",
      txRef,
      status: "pending",
    },
  });

  return Response.json({ txRef, publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY });
}
```

**Step 4 — Verify payment via webhook, not client callback**

The client callback (`redirect_url`) confirms only that the user returned from Flutterwave. It does NOT confirm payment success. Use the webhook.

```typescript
// POST /api/payments/webhook
export async function POST(request: Request) {
  const signature = request.headers.get("verif-hash");
  if (signature !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await request.json();
  const { status, tx_ref, flw_ref } = body.data;

  if (status === "successful") {
    await db.payment.update({
      where: { txRef: tx_ref },
      data: { status: "success", flwRef: flw_ref },
    });
    // Optionally update user to isPremium: true
  }

  return Response.json({ received: true });
}
```

**Step 5 — Engineering principles that become more critical with payments**

These are the answers to Law Q15 from your REFLECTION.md:

- **Murphy's Law:** Webhooks can arrive out of order, duplicated, or not at all. Build idempotency — check if `status` is already `success` before updating.
- **Kerckhoffs's Principle:** The secret key must stay server-side. If the client ever sees it, rotate immediately.
- **Technical Debt:** Storing amounts as floats will cause rounding errors. Always use integers in the smallest currency unit.
- **YAGNI:** Do not build a refund flow, subscription logic, or multi-currency support unless it is in scope.
- **Boy Scout Rule:** The payment confirmation page must not silently succeed — it must verify via the DB, not the URL parameters.
- **Least Surprise:** Users expect an email receipt after payment. Missing this erodes trust.

---

## Skill: db-migration-runner

**Trigger:** Any time the Prisma schema (`prisma/schema.prisma`) is created or modified.

**Purpose:** Apply schema changes to the database correctly, safely, and with a meaningful migration name.

### When to run this skill

- After creating the initial schema (Phase 1)
- After adding, removing, or modifying any model field
- After adding a new model
- After changing a relation, index, or unique constraint

### Steps

**Step 1 — Review the schema change**

Before running anything, read the current `prisma/schema.prisma` and confirm:
- All new models have a primary key (`@id`)
- All required fields have a type and no `?`
- All optional fields are marked with `?`
- Unique constraints are defined where needed (`@unique` or `@@unique`)
- Relations have both sides defined

**Step 2 — Generate and apply the migration**

```bash
npx prisma migrate dev --name <migration-name>
```

Migration naming convention:
- `init` — first migration only
- `add_<model>` — adding a new table (e.g. `add_password_reset_token`)
- `add_<field>_to_<model>` — adding a field (e.g. `add_email_verified_to_user`)
- `update_<model>_<description>` — modifying an existing model

**Step 3 — Verify in the database client**

After migration runs, confirm:
- The table exists with the correct column names and types
- Unique constraints are present where specified
- No orphaned tables from previous schema versions exist

**Step 4 — Regenerate the Prisma client**

`prisma migrate dev` regenerates the client automatically. If it did not (rare), run:

```bash
npx prisma generate
```

**Step 5 — Restart the development server**

The Prisma client is imported at module load time. After schema changes, restart the dev server to pick up the new client types.

```bash
# Stop the running server, then:
npm run dev
```

### Rules

- Never use `prisma db push` in this project. It skips the migration file and breaks the audit trail.
- Never edit migration files in `prisma/migrations/` after they have been applied.
- Never run migrations against the production database directly. Use Vercel's build step with `prisma migrate deploy`.
- If a migration fails, read the error before retrying. A failed migration may have partially applied — check the database state first.

### Production migration command (for Vercel build)

Add to `package.json`:
```json
"scripts": {
  "build": "prisma generate && prisma migrate deploy && next build"
}
```

---

## Skill: component-builder

**Trigger:** Any time a new UI component is needed — a form, a page section, a reusable input, or an email template.

**Purpose:** Build components that are accessible, type-safe, consistent with the project structure, and follow the SecureGate UI standard.

### Component types and where they live

| Type | Location | Examples |
|---|---|---|
| Form components | `src/components/forms/` | `LoginForm.tsx`, `SignUpForm.tsx` |
| Reusable UI elements | `src/components/ui/` | `Button.tsx`, `Input.tsx`, `PasswordStrengthBar.tsx` |
| Email templates | `src/components/email/` | `VerificationEmail.tsx`, `PasswordResetEmail.tsx` |
| Page-level layouts | `src/app/...` | `layout.tsx` files within route folders |

### Steps

**Step 1 — Determine client or server**

Default to Server Component. Add `"use client"` only if the component needs:
- `useState`, `useEffect`, or any React hook
- Browser event handlers (`onClick`, `onChange`, etc.)
- `useSession()` from NextAuth
- Access to `window`, `document`, or `localStorage`

Forms always require `"use client"` because they use state and event handlers.

**Step 2 — Define the props interface**

Every component must have a typed props interface. No implicit `any`.

```typescript
interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  // ...
}
```

**Step 3 — Accessibility requirements**

Every form component must have:
- `<label>` elements linked to inputs via `htmlFor` and matching `id`
- `aria-describedby` on inputs that have validation messages
- `aria-invalid="true"` on inputs in error state
- Disabled submit button during loading state

```typescript
<label htmlFor="email" className="block text-sm font-medium">
  Email address
</label>
<input
  id="email"
  type="email"
  aria-describedby={errors.email ? "email-error" : undefined}
  aria-invalid={!!errors.email}
  {...register("email")}
/>
{errors.email && (
  <p id="email-error" className="text-sm text-red-500">
    {errors.email.message}
  </p>
)}
```

**Step 4 — Loading state on submit**

Every form must have a loading state. The submit button must be disabled and show feedback during the request.

```typescript
const [isLoading, setIsLoading] = useState(false);

<button
  type="submit"
  disabled={isLoading}
  className="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:opacity-50"
>
  {isLoading ? "Signing in..." : "Sign In"}
</button>
```

**Step 5 — Password strength indicator (for password inputs)**

The password strength indicator is required on: Sign Up and Reset Password pages.

Strength is calculated as follows:

```typescript
function getPasswordStrength(password: string): "weak" | "fair" | "strong" {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 3) return "fair";
  return "strong";
}
```

Display: a coloured bar beneath the password field. Red = weak. Orange = fair. Green = strong. Label must show the word, not just the colour.

**Step 6 — Error message standard**

Error messages must be specific, not generic. The following messages are the standard:

| Situation | Message |
|---|---|
| Required field empty | "This field is required" |
| Invalid email format | "Please enter a valid email address" |
| Passwords do not match | "Passwords do not match" |
| Password too short | "Password must be at least 8 characters" |
| Login failure | "Invalid email or password" |
| Token expired | "This link has expired. Please request a new one." |
| Token invalid | "This link is invalid or has already been used." |
| Generic server error | "Something went wrong. Please try again." |
| Rate limited | "Too many attempts. Please try again later." |

**Step 7 — Email template components**

Email templates use React Email. They live in `src/components/email/`.

```typescript
// src/components/email/VerificationEmail.tsx
import { Html, Button, Text, Section } from "@react-email/components";

interface VerificationEmailProps {
  verificationUrl: string;
  userName?: string;
}

export function VerificationEmail({ verificationUrl, userName }: VerificationEmailProps) {
  return (
    <Html>
      <Section>
        <Text>Hi {userName ?? "there"},</Text>
        <Text>Click the button below to verify your email address. This link expires in 15 minutes.</Text>
        <Button href={verificationUrl}>Verify Email</Button>
        <Text>If you did not create this account, you can ignore this email.</Text>
      </Section>
    </Html>
  );
}
```

---

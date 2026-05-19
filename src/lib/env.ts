const requiredVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
] as const;

export function validateEnv() {
  for (const v of requiredVars) {
    if (!process.env[v]) {
      throw new Error(`Missing environment variable: ${v}`);
    }
  }
}

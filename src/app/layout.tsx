import type { Metadata } from "next";
import { SessionProvider } from "@/components/SessionProvider";
import { validateEnv } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureGate — Authentication System",
  description: "Production-ready authentication: sign up, verify, login, reset.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  validateEnv();
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

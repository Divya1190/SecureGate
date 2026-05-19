import { ReactNode } from "react";
import { SessionProvider } from "@/components/SessionProvider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <main className="auth-layout">{children}</main>
    </SessionProvider>
  );
}

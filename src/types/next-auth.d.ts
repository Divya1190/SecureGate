import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      emailVerified?: Date | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    emailVerified?: Date | null;
  }
}

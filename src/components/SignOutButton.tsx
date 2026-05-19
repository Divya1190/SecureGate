"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await signOut({ callbackUrl: "/login" });
      }}
    >
      <button id="signout-btn" type="submit" className="btn-danger">
        Sign out
      </button>
    </form>
  );
}

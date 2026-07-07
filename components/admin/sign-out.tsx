"use client";

import { signOut } from "next-auth/react";

export function AdminSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg border border-forest/20 px-3 py-1.5 text-sm font-semibold text-forest hover:bg-forest/5"
    >
      Sign out
    </button>
  );
}

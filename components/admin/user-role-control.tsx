"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["CUSTOMER", "SUPPORT", "MANAGER", "ADMIN"];

export function UserRoleControl({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: Role;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return <p className="text-sm text-ink/50">You cannot change your own role.</p>;
  }

  const setRole = async (role: Role) => {
    if (role === currentRole) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "Could not change the role");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            disabled={busy || r === currentRole}
            onClick={() => setRole(r)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[.04em] disabled:cursor-not-allowed ${
              r === currentRole
                ? "border-forest bg-forest text-white"
                : "border-forest/25 text-forest hover:bg-forest/5"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      {error ? <div className="text-xs font-semibold text-red-700">{error}</div> : null}
    </div>
  );
}

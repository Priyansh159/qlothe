import type { Role } from "@prisma/client";

// Pure, dependency-free — safe to import from client components (e.g. the
// admin sidebar, to decide which nav links to render). lib/rbac.ts re-exports
// this for server-side callers; it additionally pulls in lib/auth.ts (which
// needs next/headers), so THAT file must never be imported into client code.
const RANK: Record<Role, number> = {
  CUSTOMER: 0,
  SUPPORT: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function roleAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

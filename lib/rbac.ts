import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { roleAtLeast } from "@/lib/role-hierarchy";

export { roleAtLeast };

class ForbiddenError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Route/page-level gate: resolves the current session and throws a typed,
 * status-carrying error if it doesn't meet `minRole`. Returns the actor so
 * callers can pass it straight into a service function.
 *
 * This file and lib/auth.ts import each other (rbac needs `auth()`; auth's
 * requireAdmin() is defined in terms of requireRole()). That's safe here
 * because neither side touches the other's export at module-evaluation time
 * — only inside async function bodies invoked later, once both modules have
 * fully loaded. Next.js's bundler preserves live ES bindings, which is what
 * makes that deferred-usage pattern work.
 *
 * IMPORTANT: this file (unlike lib/role-hierarchy.ts) is server-only — it
 * transitively imports next/headers via lib/auth.ts. Client components must
 * import roleAtLeast from lib/role-hierarchy directly, never from here.
 */
export async function requireRole(minRole: Role): Promise<{ id: string; role: Role }> {
  const session = await auth();
  if (!session?.user?.id) throw new ForbiddenError("Unauthorized", 401);
  const role = session.user.role;
  if (!roleAtLeast(role, minRole)) {
    throw new ForbiddenError(`Forbidden — requires ${minRole} or higher`, 403);
  }
  return { id: session.user.id, role };
}

/**
 * Service-level backstop: every mutating (and most reading) function in
 * services/admin.ts calls this with the actor a route already resolved via
 * requireRole(), so a service is never trusting its caller — per CLAUDE.md,
 * "Admin checks server-side in services, never just hidden UI."
 */
export function assertRole(actor: { role: Role }, minRole: Role, action = "do this"): void {
  if (!roleAtLeast(actor.role, minRole)) {
    throw new ForbiddenError(`Forbidden — ${action} requires ${minRole} or higher`, 403);
  }
}

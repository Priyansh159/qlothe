import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { getUserAdmin } from "@/services/admin";
import { StatusBadge } from "@/components/admin/status-badge";
import { UserRoleControl } from "@/components/admin/user-role-control";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "User · Admin" };

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const actor = await requireRole("ADMIN");
  const result = await getUserAdmin(actor, params.id);
  if (!result) notFound();
  const { user, orders } = result;

  return (
    <div>
      <Link href="/admin/users" className="mb-4 inline-block text-sm font-semibold text-forest">
        ← All users
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold text-forest">{user.name ?? user.email}</h1>
        <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.04em] text-forest">
          {user.role}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">
              Orders ({orders.length})
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-ink/50">No orders yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-forest/10 p-3 hover:border-forest"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-forest">{o.orderNumber}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="mt-0.5 truncate text-xs text-ink/50">
                        {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                      </div>
                    </div>
                    <span className="flex-none font-semibold">{inr(o.total)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Contact</div>
            <div className="text-sm text-ink/70">{user.email}</div>
            {user.phone ? <div className="text-sm text-ink/70">{user.phone}</div> : null}
            <div className="mt-2 text-xs text-ink/45">
              Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            {user.mustChangePassword ? (
              <div className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-800">
                Hasn&apos;t set their own password yet
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Role</div>
            <UserRoleControl userId={user.id} currentRole={user.role} isSelf={user.id === actor.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

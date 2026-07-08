import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { getDashboardStats } from "@/services/admin";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard · Admin" };

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-forest/15 bg-white p-5">
      <div className="text-xs font-bold uppercase tracking-[.04em] text-ink/50">{label}</div>
      <div className="mt-1.5 font-serif text-2xl font-semibold text-forest">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-ink/45">{sub}</div> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const actor = await requireRole("SUPPORT");
  const stats = await getDashboardStats(actor);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today" value={inr(stats.today.revenue)} sub={`${stats.today.orders} orders`} />
        <StatCard label="Last 7 days" value={inr(stats.last7Days.revenue)} sub={`${stats.last7Days.orders} orders`} />
        <StatCard
          label="COD awaiting confirmation"
          value={String(stats.codPendingCount)}
          sub={stats.codPendingCount > 0 ? "needs a call/verification" : "all clear"}
        />
        <StatCard
          label="Payment stuck 15+ min"
          value={String(stats.stalePendingCount)}
          sub={stats.stalePendingCount > 0 ? "abandoned checkout, likely" : "all clear"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* low stock */}
        <div className="rounded-2xl border border-forest/15 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold uppercase tracking-[.04em] text-ink/50">Low stock (≤5)</div>
            <Link href="/admin/products" className="text-xs font-semibold text-forest underline underline-offset-4">
              Manage products
            </Link>
          </div>
          {stats.lowStockVariants.length === 0 ? (
            <p className="text-sm text-ink/50">Nothing low on stock right now.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.lowStockVariants.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{v.product.name}</span>{" "}
                    <span className="text-ink/50">
                      {v.color} / {v.size} · {v.sku}
                    </span>
                  </span>
                  <span className={`ml-3 flex-none font-bold ${v.stock === 0 ? "text-red-700" : "text-forest"}`}>
                    {v.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* recent audit — admin only */}
        {stats.recentAudit ? (
          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold uppercase tracking-[.04em] text-ink/50">Recent activity</div>
              <Link href="/admin/audit" className="text-xs font-semibold text-forest underline underline-offset-4">
                Full log
              </Link>
            </div>
            {stats.recentAudit.length === 0 ? (
              <p className="text-sm text-ink/50">No admin activity yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {stats.recentAudit.map((a) => (
                  <div key={a.id} className="text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{a.action}</span>
                      <span className="whitespace-nowrap text-xs text-ink/40">
                        {new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <div className="text-xs text-ink/50">{a.actor?.email ?? "unknown"} · {a.entityType}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start justify-center gap-2 rounded-2xl border border-dashed border-forest/20 p-5 text-sm">
            <span className="text-ink/40">Quick links</span>
            <Link href="/admin/orders" className="font-semibold text-forest underline underline-offset-4">
              View orders
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

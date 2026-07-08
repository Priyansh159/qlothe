import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { listCouponsAdmin } from "@/services/admin";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Coupons · Admin" };

export default async function AdminCouponsPage() {
  const actor = await requireRole("MANAGER");
  const coupons = await listCouponsAdmin(actor);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest">Coupons</h1>
          <p className="mt-1 text-sm text-ink/55">
            {coupons.length} {coupons.length === 1 ? "coupon" : "coupons"}
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-pine"
        >
          + New coupon
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest/15 bg-white">
        {coupons.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink/50">No coupons yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-forest/10 bg-paper text-xs font-bold uppercase tracking-[.04em] text-ink/50">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-forest/10 last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 font-semibold text-forest">{c.code}</td>
                  <td className="px-4 py-3">{c.type === "PERCENT" ? `${c.value}%` : inr(c.value)}</td>
                  <td className="px-4 py-3 text-ink/60">{c.minOrder > 0 ? inr(c.minOrder) : "—"}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {c.usedCount}
                    {c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.04em] ${
                        c.isActive ? "bg-forest/10 text-forest" : "bg-ink/10 text-ink/50"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/coupons/${c.id}`} className="text-xs font-semibold text-forest underline underline-offset-4">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

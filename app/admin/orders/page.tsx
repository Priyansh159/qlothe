import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { listOrdersAdmin } from "@/services/admin";
import { adminOrderQuerySchema } from "@/lib/validation";
import { StatusBadge } from "@/components/admin/status-badge";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders · Admin" };

const STATUSES = Object.values(OrderStatus);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const parsed = adminOrderQuerySchema.safeParse(searchParams);
  const query = parsed.success ? parsed.data : adminOrderQuerySchema.parse({});
  const { items, total, page, pages } = await listOrdersAdmin(query);

  const hrefFor = (over: Partial<{ status: string; page: number }>) => {
    const next = new URLSearchParams();
    const status = over.status !== undefined ? over.status : query.status;
    if (status) next.set("status", status);
    if (query.userId) next.set("userId", query.userId);
    next.set("page", String(over.page ?? 1));
    return `/admin/orders?${next.toString()}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest">Orders</h1>
          <p className="mt-1 text-sm text-ink/55">
            {total} {total === 1 ? "order" : "orders"}
            {query.userId ? " for this customer" : ""}
          </p>
        </div>
        {query.userId ? (
          <Link href="/admin/orders" className="text-sm font-semibold text-forest underline underline-offset-4">
            Clear customer filter
          </Link>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href={hrefFor({ status: "" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[.04em] ${
            !query.status ? "border-forest bg-forest text-white" : "border-forest/20 text-forest hover:bg-forest/5"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={hrefFor({ status: s })}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[.04em] ${
              query.status === s ? "border-forest bg-forest text-white" : "border-forest/20 text-forest hover:bg-forest/5"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest/15 bg-white">
        {items.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink/50">No orders match this filter.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-forest/10 bg-paper text-xs font-bold uppercase tracking-[.04em] text-ink/50">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-b border-forest/10 last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{o.user.name ?? o.user.email}</td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-ink/55">
                    {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-ink/55">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{inr(o.total)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/45">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={hrefFor({ page: p })}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                p === page ? "bg-forest text-white" : "border border-forest/20 text-forest hover:bg-forest/5"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

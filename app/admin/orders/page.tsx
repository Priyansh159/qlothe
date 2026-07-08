import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { listOrdersAdmin } from "@/services/admin";
import { adminOrderQuerySchema } from "@/lib/validation";
import { StatusBadge } from "@/components/admin/status-badge";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders · Admin" };

const STATUSES = Object.values(OrderStatus);

function toDateInputValue(d?: Date): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const actor = await requireRole("SUPPORT");

  const parsed = adminOrderQuerySchema.safeParse(searchParams);
  const query = parsed.success ? parsed.data : adminOrderQuerySchema.parse({});
  const { items, total, page, pages } = await listOrdersAdmin(actor, query);

  const hrefFor = (over: Partial<{ status: string; page: number }>) => {
    const next = new URLSearchParams();
    const status = over.status !== undefined ? over.status : query.status;
    if (status) next.set("status", status);
    if (query.userId) next.set("userId", query.userId);
    if (query.search) next.set("search", query.search);
    if (query.dateFrom) next.set("dateFrom", toDateInputValue(query.dateFrom));
    if (query.dateTo) next.set("dateTo", toDateInputValue(query.dateTo));
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

      {/* search + date range */}
      <form method="GET" className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-forest/15 bg-white p-4">
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
        {query.userId ? <input type="hidden" name="userId" value={query.userId} /> : null}
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[.04em] text-ink/50">
            Order # / customer email or phone
          </label>
          <input
            type="text"
            name="search"
            defaultValue={query.search ?? ""}
            placeholder="QLO-260708-A1B2 or rider@…"
            className="h-10 w-full rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[.04em] text-ink/50">From</label>
          <input
            type="date"
            name="dateFrom"
            defaultValue={toDateInputValue(query.dateFrom)}
            className="h-10 rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-[.04em] text-ink/50">To</label>
          <input
            type="date"
            name="dateTo"
            defaultValue={toDateInputValue(query.dateTo)}
            className="h-10 rounded-lg border border-forest/20 bg-white px-3 text-sm outline-none focus:border-forest"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-full bg-forest px-5 text-sm font-bold text-white hover:bg-pine"
        >
          Filter
        </button>
        {query.search || query.dateFrom || query.dateTo ? (
          <Link
            href={hrefFor({})}
            className="h-10 rounded-full border border-forest/20 px-4 text-sm font-semibold text-forest hover:bg-forest/5 flex items-center"
          >
            Clear
          </Link>
        ) : null}
      </form>

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
          <div className="overflow-x-auto">
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
          </div>
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

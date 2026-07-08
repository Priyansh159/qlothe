import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { getOrderAdmin, allowedTransitionsForRole } from "@/services/admin";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order · Admin" };

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const actor = await requireRole("SUPPORT");
  const order = await getOrderAdmin(actor, params.id);
  if (!order) notFound();

  const addr = order.shippingAddress as {
    name?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string;
  };

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-block text-sm font-semibold text-forest">
        ← All orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold text-forest">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink/55">
            Placed {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
            {order.paymentMethod}
          </p>
        </div>
        <span className="font-serif text-2xl font-bold text-forest">{inr(order.total)}</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {/* items */}
          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Items</div>
            <div className="flex flex-col gap-3">
              {order.items.map((i) => (
                <div key={i.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <span>
                    <span className="font-semibold">{i.productName}</span>{" "}
                    <span className="text-ink/50">
                      {i.variantLabel} · {i.sku} × {i.quantity}
                    </span>
                  </span>
                  <span className="whitespace-nowrap font-semibold">{inr(i.unitPrice * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-1.5 border-t border-forest/10 pt-3 text-sm">
              <Row label="Subtotal" value={inr(order.subtotal)} />
              {order.discount > 0 ? <Row label={`Discount (${order.couponCode})`} value={`−${inr(order.discount)}`} /> : null}
              <Row label="Shipping" value={order.shippingFee === 0 ? "Free" : inr(order.shippingFee)} />
              <Row label="Total" value={inr(order.total)} strong />
            </div>
          </div>

          {/* shipping info, once set */}
          {order.awbNumber || order.courier ? (
            <div className="rounded-2xl border border-forest/15 bg-white p-5">
              <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Shipment</div>
              <Row label="Courier" value={order.courier ?? "—"} />
              <Row label="AWB / tracking" value={order.awbNumber ?? "—"} />
            </div>
          ) : null}

          {/* status history */}
          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Status history</div>
            <div className="flex flex-col gap-2.5">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <div>
                    <StatusBadge status={h.status} />
                    {h.note ? <span className="ml-2 text-ink/55">{h.note}</span> : null}
                  </div>
                  <span className="whitespace-nowrap text-xs text-ink/40">
                    {new Date(h.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* payments */}
          {order.payments.length > 0 ? (
            <div className="rounded-2xl border border-forest/15 bg-white p-5">
              <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Payments</div>
              <div className="flex flex-col gap-2.5">
                {order.payments.map((p, idx) => (
                  <div key={idx} className="flex items-baseline justify-between gap-4 text-sm">
                    <span>
                      <StatusBadge status={p.status} />{" "}
                      <span className="ml-1 text-ink/50">{p.razorpayPaymentId ?? "—"}</span>
                    </span>
                    <span className="font-semibold">{inr(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          {/* customer */}
          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Customer</div>
            <div className="text-sm font-semibold">{order.user.name ?? "—"}</div>
            <div className="text-sm text-ink/60">{order.user.email}</div>
            {order.user.phone ? <div className="text-sm text-ink/60">{order.user.phone}</div> : null}
            <Link
              href={`/admin/orders?userId=${order.user.id}`}
              className="mt-2 inline-block text-xs font-semibold text-forest underline underline-offset-4"
            >
              View all their orders
            </Link>
          </div>

          {/* shipping address */}
          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Ship to</div>
            <div className="text-sm leading-relaxed text-ink/75">
              <div className="font-semibold text-ink">{addr.name}</div>
              <div>{addr.phone}</div>
              <div>
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}
              </div>
              <div>
                {addr.city}, {addr.state} {addr.pincode}
              </div>
            </div>
          </div>

          {/* status control — buttons only ever show transitions this role may trigger */}
          <div className="rounded-2xl border border-forest/15 bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Change status</div>
            <OrderStatusControl orderId={order.id} allowed={allowedTransitionsForRole(order.status, actor.role)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold" : "text-ink/60"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

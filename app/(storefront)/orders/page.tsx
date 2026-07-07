import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { listUserOrders } from "@/services/orders";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "My orders" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting payment",
  COD_PENDING: "Pay on delivery",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function OrdersPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/orders");
  const orders = await listUserOrders(userId);

  return (
    <div className="animate-qfade">
      <div className="mx-auto w-full max-w-[840px] px-[18px] pb-16 pt-7 md:px-12 md:pt-10">
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-forest/50">
          / Account
        </div>
        <h1 className="m-0 font-serif text-[32px] font-semibold uppercase tracking-[.005em] text-forest md:text-[42px]">
          My orders
        </h1>

        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-xl font-semibold text-forest">No orders yet</p>
            <p className="mb-6 mt-2 text-sm text-ink/60">Your first impression awaits.</p>
            <Link
              href="/products"
              className="inline-flex h-[50px] items-center rounded-full bg-forest px-[26px] text-[14.5px] font-bold text-white hover:bg-pine"
            >
              Start browsing
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3.5">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-forest/10 bg-paper p-[18px] transition-colors hover:border-forest"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-serif text-[17px] font-semibold text-forest">
                      {o.orderNumber}
                    </span>
                    <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.06em] text-forest">
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] text-ink/55">
                    {o.items
                      .map((i) => `${i.productName} (${i.variantLabel}) × ${i.quantity}`)
                      .join(" · ")}
                  </div>
                  <div className="mt-0.5 text-xs text-ink/40">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <span className="font-serif text-lg font-bold text-forest">{inr(o.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

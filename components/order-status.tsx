"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/components/store-provider";
import { QlotheLoader } from "@/components/loader";
import { inr } from "@/lib/format";
import { openRazorpay } from "@/lib/razorpay-client";

type OrderItem = {
  id: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPrice: number;
  quantity: number;
};

type HistoryEntry = { id: string; status: string; note: string | null; createdAt: string };

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: "RAZORPAY" | "COD";
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  razorpayOrderId: string | null;
  createdAt: string;
  shippingAddress: { name?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  items: OrderItem[];
  statusHistory: HistoryEntry[];
  payments: { status: string; razorpayPaymentId: string | null; createdAt: string }[];
};

const SUCCESS_STATUSES = new Set(["PAID", "COD_PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"]);
const POLL_MS = 2500;
const MAX_POLLS = 36; // ~90s of "confirming payment"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting payment",
  COD_PENDING: "Order confirmed — pay on delivery",
  PAID: "Payment received",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function OrderStatus({ orderId }: { orderId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const placed = params.get("placed") === "1";
  const dismissed = params.get("dismissed") === "1";
  const { razorpayKeyId, notify } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [gone, setGone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const polls = useRef(0);

  const fetchOrder = useCallback(async (): Promise<Order | null> => {
    const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
    if (res.status === 401) {
      router.push(`/login?next=/orders/${orderId}`);
      return null;
    }
    if (!res.ok) {
      setGone(true);
      return null;
    }
    const data: Order = await res.json();
    setOrder(data);
    return data;
  }, [orderId, router]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      const data = await fetchOrder();
      if (stopped || !data) return;
      if (data.status === "PENDING" && !dismissed) {
        polls.current += 1;
        if (polls.current >= MAX_POLLS) {
          setTimedOut(true);
          return;
        }
        timer = setTimeout(tick, POLL_MS);
      }
    };
    void tick();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchOrder, dismissed]);

  const retryPayment = async () => {
    if (!order?.razorpayOrderId || !razorpayKeyId) {
      notify("Payment retry unavailable — contact support", "error");
      return;
    }
    try {
      await openRazorpay({
        keyId: razorpayKeyId,
        razorpayOrderId: order.razorpayOrderId,
        amount: order.total,
        orderNumber: order.orderNumber,
        name: order.shippingAddress?.name,
        contact: order.shippingAddress?.phone,
        onPaymentSubmitted: () => {
          // full navigation so the page remounts and polling restarts cleanly
          window.location.href = `/orders/${order.id}?placed=1`;
        },
        onDismiss: () => void fetchOrder(),
      });
    } catch {
      notify("Could not open payment — try again", "error");
    }
  };

  if (gone) {
    return (
      <Centered>
        <h1 className="mb-3 font-serif text-[28px] font-semibold text-forest">Order not found</h1>
        <p className="mb-6 text-[14.5px] text-ink/60">
          This order doesn&apos;t exist or belongs to another account.
        </p>
        <Link href="/orders" className="font-semibold text-forest underline underline-offset-4">
          View my orders
        </Link>
      </Centered>
    );
  }

  if (!order) {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  const lastPayment = order.payments[order.payments.length - 1];
  const paymentFailed = order.status === "PENDING" && (dismissed || timedOut || lastPayment?.status === "FAILED");

  // ---- PENDING: confirming ----
  if (order.status === "PENDING" && !paymentFailed) {
    return (
      <Centered>
        <Spinner />
        <h1 className="mb-3 mt-[26px] font-serif text-[28px] font-semibold text-forest">
          Confirming payment…
        </h1>
        <p className="text-[14.5px] leading-relaxed text-ink/60">
          Hang tight — we&apos;re checking with your bank. Don&apos;t refresh or press back.
        </p>
      </Centered>
    );
  }

  // ---- PENDING but abandoned/failed: retry ----
  if (paymentFailed) {
    return (
      <Centered>
        <div className="mx-auto mb-6 flex h-[78px] w-[78px] items-center justify-center rounded-full bg-forest/10">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#06402B" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 8v5M12 16.5v.5" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h1 className="mb-3 font-serif text-[28px] font-semibold text-forest">
          {lastPayment?.status === "FAILED" ? "Payment failed" : "Payment incomplete"}
        </h1>
        <p className="mb-[26px] text-[14.5px] leading-relaxed text-ink/65">
          {lastPayment?.status === "FAILED"
            ? "No money was deducted. This happens sometimes — give it another go."
            : "Your order is reserved for 30 minutes. Complete the payment to confirm it."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={retryPayment}
            className="h-[52px] rounded-full bg-forest px-[30px] text-[15px] font-bold text-white hover:bg-pine"
          >
            {lastPayment?.status === "FAILED" ? "Retry payment" : "Complete payment"}
          </button>
          <Link
            href="/products"
            className="flex h-[52px] items-center rounded-full border-[1.5px] border-forest px-6 text-[15px] font-bold text-forest hover:bg-forest/5"
          >
            Keep browsing
          </Link>
        </div>
      </Centered>
    );
  }

  // ---- cancelled / refunded ----
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return (
      <Centered>
        <h1 className="mb-3 font-serif text-[28px] font-semibold text-forest">
          Order {order.orderNumber} was {order.status === "CANCELLED" ? "cancelled" : "refunded"}
        </h1>
        <p className="mb-6 text-[14.5px] text-ink/60">
          {order.status === "CANCELLED"
            ? "If money left your account, it will bounce back within 5–7 business days."
            : "The refund is on its way back to your payment method."}
        </p>
        <Link
          href="/products"
          className="inline-flex h-[52px] items-center rounded-full bg-forest px-[30px] text-[15px] font-bold text-white hover:bg-pine"
        >
          Start over
        </Link>
      </Centered>
    );
  }

  // ---- success ----
  const eta = new Date(new Date(order.createdAt).getTime() + 5 * 864e5).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const addr = order.shippingAddress ?? {};

  return (
    <div className="animate-qfade px-5 pb-20 pt-10">
      <div className="mx-auto max-w-[560px] text-center">
        <div className="mx-auto mb-6 flex h-[78px] w-[78px] animate-qpop items-center justify-center rounded-full bg-forest">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[.16em] text-forest/50">
          {placed ? "Order confirmed" : STATUS_LABELS[order.status] ?? order.status}
        </div>
        <h1 className="mb-1.5 font-serif text-[34px] font-semibold leading-[1.1] text-forest">
          {order.orderNumber}
        </h1>
        <p className="mb-1 mt-3.5 text-[14.5px] leading-relaxed text-ink/65">
          {order.status === "COD_PENDING"
            ? "Thank you — your print is being pulled. Keep the cash ready; you pay on delivery."
            : "Thank you — your print is being pulled. A confirmation is on its way to your inbox and phone."}
        </p>

        <div className="my-6 flex min-w-[280px] flex-col gap-2.5 rounded-2xl border border-forest/15 bg-paper px-6 py-[18px] text-left">
          <Row label={order.paymentMethod === "COD" ? "Amount due on delivery" : "Amount paid"} value={inr(order.total)} />
          <Row label="Arriving by" value={eta} />
          {addr.city ? <Row label="Shipping to" value={`${addr.city}, ${addr.state} ${addr.pincode ?? ""}`} /> : null}
        </div>

        {/* items */}
        <div className="mb-6 flex flex-col gap-2.5 rounded-2xl border border-forest/15 px-6 py-[18px] text-left">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-baseline justify-between gap-4 text-[13.5px]">
              <span className="min-w-0">
                <span className="font-semibold">{i.productName}</span>{" "}
                <span className="text-ink/50">
                  {i.variantLabel} × {i.quantity}
                </span>
              </span>
              <span className="whitespace-nowrap font-semibold">{inr(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
          <div className="mt-1 border-t border-forest/10 pt-2.5">
            <div className="flex justify-between text-[13px] text-ink/55">
              <span>Subtotal</span>
              <span>{inr(order.subtotal)}</span>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-[13px] text-forest">
                <span>Discount</span>
                <span>−{inr(order.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-[13px] text-ink/55">
              <span>Shipping</span>
              <span>{order.shippingFee === 0 ? "Free" : inr(order.shippingFee)}</span>
            </div>
          </div>
        </div>

        {/* timeline */}
        <div className="mb-8 flex flex-col gap-2 rounded-2xl border border-forest/15 px-6 py-[18px] text-left">
          {order.statusHistory.map((h) => (
            <div key={h.id} className="flex items-baseline justify-between gap-4 text-[12.5px]">
              <span className="font-semibold text-forest">{STATUS_LABELS[h.status] ?? h.status}</span>
              <span className="whitespace-nowrap text-ink/45">
                {new Date(h.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="flex h-[50px] items-center rounded-full bg-forest px-[26px] text-[14.5px] font-bold text-white hover:bg-pine"
          >
            Continue shopping
          </Link>
          <Link
            href="/orders"
            className="flex h-[50px] items-center rounded-full border-[1.5px] border-forest px-[26px] text-[14.5px] font-bold text-forest hover:bg-forest/5"
          >
            My orders
          </Link>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[72vh] animate-qfade items-center justify-center px-5 pb-20 pt-10">
      <div className="max-w-[440px] text-center">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center">
      <QlotheLoader size="lg" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-10 text-[13.5px]">
      <span className="whitespace-nowrap text-ink/55">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}

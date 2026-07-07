"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/store-provider";
import { ProductImage } from "@/components/product-image";
import { productImageUrl } from "@/lib/images";
import { inr, gstIncluded, shippingFor, COD_FEE } from "@/lib/format";
import { openRazorpay } from "@/lib/razorpay-client";

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

type Form = {
  name: string;
  phone: string;
  pincode: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
};

type Errors = Partial<Record<keyof Form, string>>;

// Mirrors lib/validation.ts addressSchema — display-only; the server re-validates.
function validate(f: Form): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Enter your name";
  if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = "Enter a valid 10-digit mobile";
  if (!/^\d{6}$/.test(f.pincode)) e.pincode = "6 digits";
  if (f.line1.trim().length < 3) e.line1 = "Enter your address";
  if (f.city.trim().length < 2) e.city = "Enter your city";
  if (f.state.trim().length < 2) e.state = "Select a state";
  return e;
}

export function CheckoutClient() {
  const router = useRouter();
  const { cart, cloudName, razorpayKeyId, user, notify, refreshCart } = useStore();

  const [form, setForm] = useState<Form>({
    name: "", phone: "", pincode: "", line1: "", line2: "", city: "", state: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [pay, setPay] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [coupon, setCoupon] = useState("");
  const [couponSet, setCouponSet] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = shippingFor(subtotal, pay === "COD");
  const payable = subtotal + shipping; // discount applied server-side at order time

  const set = (k: keyof Form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const inputClass = (err?: string) =>
    `h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-forest ${
      err ? "border-forest" : "border-forest/20"
    }`;

  const placeOrder = async () => {
    const e = validate(form);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      notify("Please complete the highlighted fields", "error");
      return;
    }
    if (items.length === 0) {
      notify("Your bag is empty", "error");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: pay,
          address: {
            name: form.name.trim(),
            phone: form.phone,
            line1: form.line1.trim(),
            ...(form.line2.trim() ? { line2: form.line2.trim() } : {}),
            city: form.city.trim(),
            state: form.state,
            pincode: form.pincode,
          },
          ...(couponSet ? { couponCode: couponSet } : {}),
        }),
      });
      const body = await res.json().catch(() => null);

      if (res.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }
      if (!res.ok) {
        notify(typeof body?.error === "string" ? body.error : "Could not place the order", "error");
        if (res.status === 409) void refreshCart(); // stock changed under us
        return;
      }

      void refreshCart(); // cart was consumed by the order

      if (body.razorpay?.orderId && body.razorpay?.keyId) {
        try {
          await openRazorpay({
            keyId: body.razorpay.keyId,
            razorpayOrderId: body.razorpay.orderId,
            amount: body.total,
            orderNumber: body.orderNumber,
            name: form.name,
            contact: form.phone,
            onPaymentSubmitted: () => router.push(`/orders/${body.orderId}?placed=1`),
            onDismiss: () => router.push(`/orders/${body.orderId}?placed=1&dismissed=1`),
          });
        } catch {
          // checkout.js failed to load — the order exists; let the order page handle retry
          router.push(`/orders/${body.orderId}?placed=1&dismissed=1`);
        }
      } else {
        router.push(`/orders/${body.orderId}?placed=1`);
      }
    } finally {
      setPlacing(false);
    }
  };

  const radioCard = (active: boolean) =>
    `flex w-full cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] p-4 text-left text-[19px] text-forest ${
      active ? "border-forest bg-forest/5" : "border-forest/15 bg-paper"
    }`;

  return (
    <div className="animate-qfade">
      <div className="mx-auto w-full max-w-[1200px] px-[18px] pb-1 pt-7 md:px-12 md:pt-10">
        <Link href="/cart" className="mb-3.5 inline-block whitespace-nowrap text-[13.5px] font-semibold text-forest">
          ← Back to bag
        </Link>
        <h1 className="m-0 font-serif text-[32px] font-semibold uppercase tracking-[.005em] text-forest md:text-[42px]">
          Checkout
        </h1>
      </div>

      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-start gap-[26px] px-[18px] py-8 md:grid-cols-[1fr_380px] md:gap-10 md:px-12 md:py-[54px]">
        {/* forms */}
        <div className="flex flex-col gap-[26px]">
          <div>
            <div className="mb-3.5 font-serif text-[19px] font-semibold">Deliver to</div>
            <div className="rounded-[20px] border border-forest/15 bg-paper p-[22px]">
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="mb-[7px] block text-[12.5px] font-semibold text-ink/60">Full name</label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    placeholder="Arjun Mehta"
                    className={inputClass(errors.name)}
                  />
                  {errors.name ? <div className="mt-1.5 text-xs font-semibold text-forest">{errors.name}</div> : null}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-[7px] block text-[12.5px] font-semibold text-ink/60">
                      Mobile (10-digit)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink/50">+91</span>
                      <input
                        value={form.phone}
                        onChange={(e) => set("phone")(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        inputMode="numeric"
                        placeholder="98XXXXXXXX"
                        className={`${inputClass(errors.phone)} pl-11`}
                      />
                    </div>
                    {errors.phone ? (
                      <div className="mt-1.5 text-xs font-semibold text-forest">{errors.phone}</div>
                    ) : null}
                  </div>
                  <div className="w-[130px] flex-none">
                    <label className="mb-[7px] block text-[12.5px] font-semibold text-ink/60">Pincode</label>
                    <input
                      value={form.pincode}
                      onChange={(e) => set("pincode")(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      placeholder="400001"
                      className={inputClass(errors.pincode)}
                    />
                    {errors.pincode ? (
                      <div className="mt-1.5 text-xs font-semibold text-forest">{errors.pincode}</div>
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className="mb-[7px] block text-[12.5px] font-semibold text-ink/60">Address</label>
                  <input
                    value={form.line1}
                    onChange={(e) => set("line1")(e.target.value)}
                    placeholder="Flat / House no, street, area"
                    className={inputClass(errors.line1)}
                  />
                  {errors.line1 ? (
                    <div className="mt-1.5 text-xs font-semibold text-forest">{errors.line1}</div>
                  ) : null}
                </div>
                <div>
                  <label className="mb-[7px] block text-[12.5px] font-semibold text-ink/60">
                    Landmark (optional)
                  </label>
                  <input
                    value={form.line2}
                    onChange={(e) => set("line2")(e.target.value)}
                    placeholder="Near…"
                    className={inputClass()}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-[7px] block text-[12.5px] font-semibold text-ink/60">City</label>
                    <input
                      value={form.city}
                      onChange={(e) => set("city")(e.target.value)}
                      placeholder="Mumbai"
                      className={inputClass(errors.city)}
                    />
                    {errors.city ? (
                      <div className="mt-1.5 text-xs font-semibold text-forest">{errors.city}</div>
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <label className="mb-[7px] block text-[12.5px] font-semibold text-ink/60">State</label>
                    <div className="relative">
                      <select
                        value={form.state}
                        onChange={(e) => set("state")(e.target.value)}
                        className={`${inputClass(errors.state)} cursor-pointer appearance-none pr-9`}
                      >
                        <option value="">Select</option>
                        {STATES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-[15px] top-1/2 -translate-y-1/2 text-[10px] text-forest">
                        ▼
                      </span>
                    </div>
                    {errors.state ? (
                      <div className="mt-1.5 text-xs font-semibold text-forest">{errors.state}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* payment */}
          <div>
            <div className="mb-3.5 font-serif text-[19px] font-semibold">Payment</div>
            <div className="flex flex-col gap-[11px]">
              <button onClick={() => setPay("RAZORPAY")} className={radioCard(pay === "RAZORPAY")}>
                <div className="mt-px flex-none">{pay === "RAZORPAY" ? "◉" : "○"}</div>
                <div className="flex-1 text-left">
                  <div className="text-[14.5px] font-semibold text-ink">UPI / Card / Netbanking</div>
                  <div className="mt-0.5 text-[12.5px] text-ink/55">Secure payment via Razorpay</div>
                </div>
                <span className="font-mono text-[10px] text-forest/50">RECOMMENDED</span>
              </button>
              <button onClick={() => setPay("COD")} className={radioCard(pay === "COD")}>
                <div className="mt-px flex-none">{pay === "COD" ? "◉" : "○"}</div>
                <div className="flex-1 text-left">
                  <div className="text-[14.5px] font-semibold text-ink">Cash on Delivery</div>
                  <div className="mt-0.5 text-[12.5px] text-ink/55">
                    Pay when it arrives · +{inr(COD_FEE)} handling fee
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* order summary */}
        <div className="rounded-[20px] border border-forest/15 bg-paper p-[22px] md:sticky md:top-[124px]">
          <div className="mb-4 font-serif text-xl font-semibold">Order summary</div>
          {items.length === 0 ? (
            <p className="mb-4 text-sm text-ink/60">
              Your bag is empty.{" "}
              <Link href="/products" className="font-semibold text-forest underline">
                Browse tees
              </Link>
            </p>
          ) : (
            <div className="mb-4 flex flex-col gap-3">
              {items.map((l) => (
                <div key={l.id} className="flex items-center gap-[11px]">
                  <div className="relative h-[54px] w-11 flex-none overflow-hidden rounded-[9px] border border-forest/15 bg-white">
                    <ProductImage
                      src={productImageUrl(cloudName, l.image, 150)}
                      alt={l.name}
                      className="absolute inset-0 h-full w-full"
                    />
                    <span className="absolute -right-0 -top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white">
                      {l.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold leading-tight">{l.name}</div>
                    <div className="text-[11.5px] text-ink/50">{l.label}</div>
                  </div>
                  <span className="text-[13.5px] font-semibold">{inr(l.lineTotal)}</span>
                </div>
              ))}
            </div>
          )}

          {/* coupon */}
          <div className="mb-4 flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="h-[46px] min-w-0 flex-1 rounded-xl border-[1.5px] border-forest/20 bg-white px-3.5 text-sm uppercase outline-none focus:border-forest"
            />
            <button
              onClick={() => {
                const c = coupon.trim();
                if (!c) return;
                setCouponSet(c);
                notify(`${c} will be applied at payment`);
              }}
              className="h-[46px] whitespace-nowrap rounded-xl border-[1.5px] border-forest px-[18px] text-[13.5px] font-bold text-forest hover:bg-forest/5"
            >
              Apply
            </button>
          </div>
          {couponSet ? (
            <div className="-mt-2 mb-3.5 flex items-center justify-between text-[12.5px] font-semibold text-forest">
              <span>✓ {couponSet} — verified when you pay</span>
              <button
                onClick={() => {
                  setCouponSet(null);
                  setCoupon("");
                }}
                className="text-ink/40 hover:text-forest"
              >
                ✕
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">Subtotal</span>
              <span className="font-semibold">{inr(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Shipping{pay === "COD" ? " + COD" : ""}</span>
              <span className="font-semibold text-forest">{shipping === 0 ? "Free" : inr(shipping)}</span>
            </div>
            <div className="flex justify-between text-[12.5px] text-ink/45">
              <span>Incl. GST (5%)</span>
              <span>{inr(gstIncluded(payable))}</span>
            </div>
          </div>
          <div className="my-4 h-px bg-forest/15" />
          <div className="mb-[18px] flex items-baseline justify-between">
            <span className="text-[15px] font-bold">To pay</span>
            <span className="font-serif text-[27px] font-bold text-forest">{inr(payable)}</span>
          </div>
          <button
            onClick={placeOrder}
            disabled={placing || items.length === 0}
            className="h-14 w-full rounded-full bg-forest text-base font-bold text-white hover:bg-pine disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing ? "Placing order…" : `Place order · ${inr(payable)}`}
          </button>
          <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11.5px] text-ink/50">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            256-bit secured · UPI · Visa · Mastercard · COD
          </div>
          {user ? null : (
            <p className="mt-3 text-center text-xs text-ink/50">
              You&apos;ll be asked to sign in before payment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

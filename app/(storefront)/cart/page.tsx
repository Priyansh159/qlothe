"use client";

import Link from "next/link";
import { useStore } from "@/components/store-provider";
import { ProductImage } from "@/components/product-image";
import { QlotheLoader } from "@/components/loader";
import { productImageUrl } from "@/lib/images";
import { inr, gstIncluded, shippingFor } from "@/lib/format";

export default function CartPage() {
  const { cart, cartBusy, setQuantity, removeItem, cloudName } = useStore();

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = shippingFor(subtotal, false);
  const total = subtotal + shipping;

  return (
    <div className="animate-qfade">
      <div className="mx-auto w-full max-w-[1200px] px-[18px] pb-1 pt-7 md:px-12 md:pt-10">
        <h1 className="m-0 font-serif text-[32px] font-semibold uppercase tracking-[.005em] text-forest md:text-[42px]">
          Your bag
        </h1>
      </div>

      {cart === null ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <QlotheLoader size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="mx-auto max-w-[440px] px-5 pb-[90px] pt-[30px] text-center">
          <div className="relative mx-auto mb-6 flex h-[120px] w-[120px] items-center justify-center rounded-full border-[1.5px] border-forest/25">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#06402B" strokeWidth="1.5">
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </div>
          <h2 className="mb-2.5 font-serif text-[26px] font-semibold text-forest">Your bag is empty</h2>
          <p className="mb-[26px] text-[14.5px] leading-relaxed text-ink/60">
            No impressions yet. Go find a print worth wearing.
          </p>
          <Link
            href="/products"
            className="inline-flex h-[52px] items-center rounded-full bg-forest px-[30px] text-[15px] font-bold text-white hover:bg-pine"
          >
            Start browsing
          </Link>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-start gap-[22px] px-[18px] py-8 md:grid-cols-[1fr_360px] md:gap-8 md:px-12 md:py-[54px]">
          {/* lines */}
          <div className="flex flex-col gap-3.5">
            {items.map((l) => (
              <div
                key={l.id}
                className="flex gap-3.5 rounded-[18px] border border-forest/10 bg-paper p-3.5"
              >
                <Link
                  href={`/products/${l.slug}`}
                  className="relative h-[110px] w-[88px] flex-none overflow-hidden rounded-[14px] border border-forest/15 bg-white"
                >
                  <ProductImage
                    src={productImageUrl(cloudName, l.image, 300)}
                    alt={l.name}
                    className="absolute inset-0 h-full w-full"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-2.5">
                    <Link href={`/products/${l.slug}`} className="text-[14.5px] font-semibold leading-tight">
                      {l.name}
                    </Link>
                    <button
                      onClick={() => removeItem(l.variantId)}
                      aria-label="Remove"
                      className="flex-none p-0.5 text-ink/40 hover:text-forest"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-ink/55">{l.label}</div>
                  {!l.available ? (
                    <div className="mt-1.5 inline-flex self-start rounded-full bg-forest/10 px-2 py-0.5 text-[11px] font-bold text-forest">
                      Not enough stock
                    </div>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between gap-2.5 pt-2.5">
                    <div className="flex h-[38px] items-center rounded-full border-[1.5px] border-forest/20">
                      <button
                        disabled={cartBusy || l.quantity <= 1}
                        onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                        className="h-9 w-9 rounded-full text-[17px] text-forest disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{l.quantity}</span>
                      <button
                        disabled={cartBusy || l.quantity >= 10}
                        onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                        className="h-9 w-9 rounded-full text-[17px] text-forest disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-serif text-[17px] font-semibold text-forest">
                      {inr(l.lineTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* summary */}
          <div className="rounded-[20px] border border-forest/15 bg-paper p-[22px] md:sticky md:top-[124px]">
            <div className="mb-4 font-serif text-xl font-semibold">Summary</div>
            <div className="flex flex-col gap-[11px] text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">Subtotal</span>
                <span className="font-semibold">{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Shipping</span>
                <span className="font-semibold text-forest">
                  {shipping === 0 ? "Free" : inr(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-[12.5px] text-ink/45">
                <span>Incl. GST (5%)</span>
                <span>{inr(gstIncluded(total))}</span>
              </div>
            </div>
            <div className="my-4 h-px bg-forest/15" />
            <div className="mb-[18px] flex items-baseline justify-between">
              <span className="text-[15px] font-bold">Total</span>
              <span className="font-serif text-[26px] font-bold text-forest">{inr(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="flex h-[54px] w-full items-center justify-center rounded-full bg-forest text-[15.5px] font-bold text-white hover:bg-pine"
            >
              Checkout
            </Link>
            <Link
              href="/products"
              className="mt-2.5 flex h-[46px] w-full items-center justify-center text-[13.5px] font-semibold text-forest underline underline-offset-[3px]"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

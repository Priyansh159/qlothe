"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-provider";
import { ProductImage } from "@/components/product-image";
import { productImageUrl } from "@/lib/images";
import { inr } from "@/lib/format";

export function CartDrawer() {
  const router = useRouter();
  const { cart, cartCount, cartBusy, drawerOpen, closeDrawer, setQuantity, removeItem, cloudName } =
    useStore();

  if (!drawerOpen) return null;

  const items = cart?.items ?? [];

  const go = (href: string) => {
    closeDrawer();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 animate-qfade bg-forest/35" onClick={closeDrawer} />
      <div className="absolute bottom-0 right-0 top-0 flex w-[min(420px,100%)] animate-qdrawer flex-col bg-white shadow-[-10px_0_40px_rgba(6,64,43,.18)]">
        <div className="flex items-center justify-between border-b border-forest/15 px-[22px] py-5">
          <div className="font-serif text-[19px] font-semibold text-forest">Your bag · {cartCount}</div>
          <button
            onClick={closeDrawer}
            aria-label="Close"
            className="h-[38px] w-[38px] rounded-full bg-forest/10 text-base text-forest"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[18px]">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-ink/60">No impressions yet. Go find a print worth wearing.</p>
              <button
                onClick={() => go("/products")}
                className="h-11 rounded-full bg-forest px-6 text-sm font-bold text-white hover:bg-pine"
              >
                Start browsing
              </button>
            </div>
          ) : (
            items.map((l) => (
              <div key={l.id} className="flex gap-3">
                <Link
                  href={`/products/${l.slug}`}
                  onClick={closeDrawer}
                  className="relative h-20 w-16 flex-none overflow-hidden rounded-[11px] border border-forest/15 bg-paper"
                >
                  <ProductImage
                    src={productImageUrl(cloudName, l.image, 200)}
                    alt={l.name}
                    className="absolute inset-0 h-full w-full"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold leading-tight">{l.name}</div>
                      <div className="mt-0.5 text-xs text-ink/55">{l.label}</div>
                    </div>
                    <button
                      onClick={() => removeItem(l.variantId)}
                      aria-label="Remove"
                      className="flex-none text-xs text-ink/40 hover:text-forest"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex h-8 items-center rounded-full border-[1.5px] border-forest/20">
                      <button
                        disabled={cartBusy || l.quantity <= 1}
                        onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                        className="h-[30px] w-[30px] text-forest disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-[13px] font-bold">{l.quantity}</span>
                      <button
                        disabled={cartBusy || l.quantity >= 10}
                        onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                        className="h-[30px] w-[30px] text-forest disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-serif text-[15px] font-semibold text-forest">
                      {inr(l.lineTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-forest/15 px-[22px] py-[18px]">
            <div className="mb-3.5 flex items-baseline justify-between">
              <span className="font-bold">Subtotal</span>
              <span className="font-serif text-[22px] font-bold text-forest">
                {inr(cart?.subtotal ?? 0)}
              </span>
            </div>
            <button
              onClick={() => go("/checkout")}
              className="h-[52px] w-full rounded-full bg-forest text-[15px] font-bold text-white hover:bg-pine"
            >
              Checkout
            </button>
            <button
              onClick={() => go("/cart")}
              className="mt-2 h-[42px] w-full text-[13px] font-semibold text-forest underline underline-offset-[3px]"
            >
              View full bag
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

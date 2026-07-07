"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/components/store-provider";
import { ProductImage } from "@/components/product-image";
import { productImageUrl } from "@/lib/images";
import { inr } from "@/lib/format";
import { categoryName, colorHex, isLightColor, SIZES } from "@/lib/catalog";

export type DetailVariant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number; // paise, inheritance already resolved server-side
  inStock: boolean;
  lowStock: boolean;
};

export type DetailProduct = {
  name: string;
  category: string;
  description: string | null;
  attributes: Record<string, unknown>;
  images: string[]; // cloudinary public ids, sorted
  variants: DetailVariant[];
};

const GALLERY_LABELS = ["FRONT", "BACK", "DETAIL"];

function sizeRank(s: string) {
  const i = (SIZES as readonly string[]).indexOf(s);
  return i === -1 ? SIZES.length : i;
}

export function ProductDetail({ product }: { product: DetailProduct }) {
  const { cloudName, addToCart, cartBusy } = useStore();

  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color))),
    [product.variants],
  );
  const defaultColor =
    colors.find((c) => product.variants.some((v) => v.color === c && v.inStock)) ?? colors[0] ?? "";

  const [color, setColor] = useState(defaultColor);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [sizeErr, setSizeErr] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [openAcc, setOpenAcc] = useState("fabric");

  const colorVariants = useMemo(
    () =>
      product.variants
        .filter((v) => v.color === color)
        .sort((a, b) => sizeRank(a.size) - sizeRank(b.size)),
    [product.variants, color],
  );
  const selected = colorVariants.find((v) => v.size === size) ?? null;
  const displayPrice = selected?.price ?? colorVariants[0]?.price ?? product.variants[0]?.price ?? 0;
  const allOut = product.variants.every((v) => !v.inStock);

  const gallery = product.images.length > 0 ? product.images : [null];

  const attrs = product.attributes ?? {};
  const fabricBody =
    product.description ??
    `${attrs.gsm ? `${attrs.gsm} GSM ` : ""}${typeof attrs.fabric === "string" ? attrs.fabric : "combed cotton"}, garment-dyed for a lived-in hand. Water-based soft-hand print that breathes.`;

  const accordion = [
    { k: "fabric", title: "Fabric & weight", body: fabricBody },
    {
      k: "fit",
      title: "Fit & sizing",
      body: `${typeof attrs.fit === "string" ? `${attrs.fit[0].toUpperCase()}${attrs.fit.slice(1)} fit. ` : ""}Between sizes? Size down for a classic fit, stay true for oversized.`,
    },
    {
      k: "care",
      title: "Care",
      body: "Machine wash cold, inside out, with like colours. Tumble dry low or hang. Do not iron directly over the print. Made to soften beautifully with every wash.",
    },
  ];

  const onAdd = async () => {
    if (!selected) {
      setSizeErr(true);
      return;
    }
    const ok = await addToCart(selected.id, qty, product.name);
    if (ok) setSizeErr(false);
  };

  const pillClass = (active: boolean, disabled: boolean) => {
    const base =
      "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3.5 text-[13.5px] font-semibold transition-all ";
    if (disabled)
      return base + "border-[1.5px] border-dashed border-forest/30 text-forest/30 line-through cursor-not-allowed";
    if (active) return base + "border-[1.5px] border-forest bg-forest text-white";
    return base + "border-[1.5px] border-forest/25 text-forest hover:border-forest";
  };

  return (
    <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-start gap-[26px] px-[18px] pb-1 pt-7 md:grid-cols-2 md:gap-12 md:px-12 md:pt-10">
      {/* gallery */}
      <div className="md:sticky md:top-[124px]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] border border-forest/15 bg-paper">
          <ProductImage
            src={productImageUrl(cloudName, gallery[galleryIdx], 1000)}
            alt={product.name}
            label={GALLERY_LABELS[galleryIdx] ?? "PHOTO"}
            className="absolute inset-0 h-full w-full"
          />
        </div>
        {gallery.length > 1 ? (
          <div className="mt-3 flex gap-2.5">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setGalleryIdx(i)}
                className={`relative aspect-square flex-1 overflow-hidden rounded-xl bg-paper ${
                  galleryIdx === i ? "border-2 border-forest" : "border border-forest/15"
                }`}
              >
                <ProductImage
                  src={productImageUrl(cloudName, img, 300)}
                  alt={`${product.name} — view ${i + 1}`}
                  label={GALLERY_LABELS[i] ?? `VIEW ${i + 1}`}
                  className="absolute inset-0 h-full w-full"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* info */}
      <div>
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-forest/50">
          {categoryName(product.category).toUpperCase()} FIT
        </div>
        <h1 className="m-0 font-serif text-[30px] font-semibold leading-[1.02] tracking-[-.01em] text-forest md:text-[40px]">
          {product.name}
        </h1>
        <div className="my-4 flex items-baseline gap-3">
          <span className="font-serif text-[30px] font-semibold text-forest">{inr(displayPrice)}</span>
        </div>
        {product.description ? (
          <p className="mb-[22px] max-w-[460px] text-[14.5px] leading-relaxed text-ink/70">
            {product.description}
          </p>
        ) : null}

        {/* colour */}
        {colors.length > 0 ? (
          <div className="mb-5">
            <div className="mb-[11px] flex justify-between">
              <span className="text-[13px] font-bold tracking-[.02em]">Colour</span>
              <span className="text-[13px] text-ink/55">{color}</span>
            </div>
            <div className="flex gap-[11px]">
              {colors.map((c) => {
                const hex = colorHex(c);
                return (
                  <button
                    key={c}
                    aria-label={c}
                    onClick={() => {
                      setColor(c);
                      setSize("");
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 p-0 ${
                      color === c ? "border-forest" : "border-transparent"
                    }`}
                  >
                    <span
                      className="h-[30px] w-[30px] rounded-full"
                      style={{
                        background: hex,
                        border: isLightColor(hex) ? "1px solid rgba(6,64,43,.25)" : "1px solid transparent",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* size */}
        <div className="mb-[22px]">
          <div className="mb-[11px] flex items-center justify-between">
            <span className="text-[13px] font-bold tracking-[.02em]">Size</span>
            <span className="text-[12.5px] text-forest underline underline-offset-[3px]">Size guide</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((v) => (
              <button
                key={v.id}
                disabled={!v.inStock}
                onClick={() => {
                  setSize(v.size);
                  setSizeErr(false);
                }}
                className={pillClass(size === v.size, !v.inStock)}
              >
                {v.size}
              </button>
            ))}
          </div>
          {sizeErr ? (
            <div className="mt-2 text-[12.5px] font-semibold text-forest">
              Please pick a size to continue.
            </div>
          ) : null}
        </div>

        {/* qty + add */}
        <div className="mb-4 flex items-stretch gap-3">
          <div className="flex h-[54px] items-center rounded-full border-[1.5px] border-forest/25 px-1.5">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-[42px] w-[42px] rounded-full text-xl text-forest hover:bg-forest/10"
            >
              −
            </button>
            <span className="w-[30px] text-center text-base font-bold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(10, q + 1))}
              className="h-[42px] w-[42px] rounded-full text-xl text-forest hover:bg-forest/10"
            >
              +
            </button>
          </div>
          <button
            onClick={onAdd}
            disabled={cartBusy || allOut}
            className="h-[54px] flex-1 rounded-full bg-forest text-[15.5px] font-bold tracking-[.01em] text-white hover:bg-pine disabled:cursor-not-allowed disabled:opacity-60"
          >
            {allOut ? "Sold out" : `Add to cart · ${inr(displayPrice * qty)}`}
          </button>
        </div>
        {selected?.lowStock ? (
          <div className="mb-[26px] flex items-center gap-2 text-[13px] font-medium text-forest/60">
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-forest" />
            Only a few left in this size.
          </div>
        ) : null}

        {/* accordion */}
        <div className="border-t border-forest/15">
          {accordion.map((a) => (
            <div key={a.k} className="border-b border-forest/15">
              <button
                onClick={() => setOpenAcc((cur) => (cur === a.k ? "" : a.k))}
                className="flex w-full items-center justify-between py-4 text-sm font-semibold text-ink"
              >
                {a.title}
                <span className="text-lg text-forest">{openAcc === a.k ? "−" : "+"}</span>
              </button>
              {openAcc === a.k ? (
                <div className="pb-[18px] text-[13.5px] leading-[1.65] text-ink/70">{a.body}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

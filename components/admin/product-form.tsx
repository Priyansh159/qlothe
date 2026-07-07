"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/store-provider";
import { ImageUploader, type ImageEntry } from "@/components/admin/image-uploader";
import { CATEGORIES, SIZES } from "@/lib/catalog";

type VariantRow = {
  id?: string; // present when editing an existing DB row
  sku: string;
  size: string;
  color: string;
  priceRupees: string; // blank = inherit basePrice
  stock: string;
};

export type ProductFormInitial = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  basePriceRupees: string;
  isActive: boolean;
  fabric: string;
  gsm: string;
  fit: string;
  variants: VariantRow[];
  images: ImageEntry[];
};

const inputClass =
  "h-11 w-full rounded-lg border border-forest/20 bg-white px-3 text-sm text-ink outline-none focus:border-forest";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-[.04em] text-ink/50";

function rupeesToPaise(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function emptyVariant(): VariantRow {
  return { sku: "", size: "M", color: "", priceRupees: "", stock: "0" };
}

export function ProductForm({ initial }: { initial: ProductFormInitial | null }) {
  const router = useRouter();
  const { cloudName, notify } = useStore();
  const editing = initial !== null;

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0].slug);
  const [basePriceRupees, setBasePriceRupees] = useState(initial?.basePriceRupees ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [fabric, setFabric] = useState(initial?.fabric ?? "100% cotton");
  const [gsm, setGsm] = useState(initial?.gsm ?? "240");
  const [fit, setFit] = useState(initial?.fit ?? "oversized");
  const [variants, setVariants] = useState<VariantRow[]>(initial?.variants ?? [emptyVariant()]);
  const [images, setImages] = useState<ImageEntry[]>(initial?.images ?? []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setVariant = (idx: number, patch: Partial<VariantRow>) => {
    setVariants((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addVariant = () => setVariants((rows) => [...rows, emptyVariant()]);
  const removeVariant = (idx: number) => setVariants((rows) => rows.filter((_, i) => i !== idx));

  // Mirrors lib/validation.ts productCreateSchema — display-only; the server re-validates.
  const validate = (): string | null => {
    if (!name.trim()) return "Give the product a name.";
    if (!editing && !/^[a-z0-9-]+$/.test(slug.trim())) {
      return "Slug can only contain lowercase letters, numbers and hyphens.";
    }
    if (!category.trim()) return "Pick or type a category.";
    const price = Number(basePriceRupees);
    if (!Number.isFinite(price) || price <= 0) return "Base price must be greater than ₹0.";
    if (variants.length === 0) return "Add at least one variant.";
    if (variants.some((v) => !v.sku.trim() || !v.color.trim())) {
      return "Every variant needs a SKU and colour.";
    }
    const skus = variants.map((v) => v.sku.trim().toUpperCase());
    const dupSku = skus.find((s, i) => skus.indexOf(s) !== i);
    if (dupSku) return `Duplicate SKU in this form: ${dupSku}. Each variant needs its own SKU.`;
    const combos = variants.map((v) => `${v.size}/${v.color.trim().toLowerCase()}`);
    const dupCombo = combos.find((c, i) => combos.indexOf(c) !== i);
    if (dupCombo) return `Two variants have the same size + colour (${dupCombo}) — merge them.`;
    for (const v of variants) {
      const stock = Number(v.stock);
      if (!Number.isInteger(stock) || stock < 0) return `Stock for ${v.sku} must be a whole number ≥ 0.`;
      if (v.priceRupees.trim()) {
        const override = Number(v.priceRupees);
        if (!Number.isFinite(override) || override <= 0) {
          return `Price override for ${v.sku} must be greater than ₹0 (or blank to inherit).`;
        }
      }
    }
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      basePrice: rupeesToPaise(basePriceRupees),
      attributes: {
        ...(fabric.trim() ? { fabric: fabric.trim() } : {}),
        ...(gsm.trim() ? { gsm: Number(gsm) } : {}),
        ...(fit.trim() ? { fit: fit.trim() } : {}),
      },
      isActive,
      variants: variants.map((v) => ({
        sku: v.sku.trim(),
        size: v.size.trim(),
        color: v.color.trim(),
        price: v.priceRupees.trim() ? rupeesToPaise(v.priceRupees) : null,
        stock: Number(v.stock) || 0,
      })),
      images: images.map((img, i) => ({
        ...(img.id ? { id: img.id } : {}),
        cloudinaryPublicId: img.cloudinaryPublicId,
        sortOrder: i,
      })),
    };
    if (!editing) body.slug = slug.trim();

    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg =
          typeof err?.error === "string"
            ? err.error
            : err?.error?.formErrors?.[0] ?? "Could not save the product — check the fields above.";
        setError(msg);
        return;
      }
      notify(editing ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="rounded-2xl border border-forest/15 bg-white p-5">
        <div className="mb-4 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Basics</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Slug {editing ? <span className="normal-case text-ink/35">(fixed after creation)</span> : null}
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
              disabled={editing}
              required
              placeholder="vintage-bull-oversized-tee"
              className={`${inputClass} disabled:bg-paper disabled:text-ink/50`}
            />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <input
              list="admin-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className={inputClass}
            />
            <datalist id="admin-categories">
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Base price (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={basePriceRupees}
              onChange={(e) => setBasePriceRupees(e.target.value)}
              required
              placeholder="799"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} h-auto resize-y py-2`}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            Visible on storefront
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-forest/15 bg-white p-5">
        <div className="mb-4 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Fabric details</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass}>Fabric</label>
            <input value={fabric} onChange={(e) => setFabric(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>GSM</label>
            <input type="number" value={gsm} onChange={(e) => setGsm(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fit</label>
            <input value={fit} onChange={(e) => setFit(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-forest/15 bg-white p-5">
        <div className="mb-4 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Photos</div>
        <ImageUploader cloudName={cloudName} images={images} onChange={setImages} />
      </div>

      <div className="rounded-2xl border border-forest/15 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-bold uppercase tracking-[.04em] text-ink/50">Variants</div>
          <button
            type="button"
            onClick={addVariant}
            className="rounded-full border border-forest/25 px-3 py-1.5 text-xs font-bold text-forest hover:bg-forest/5"
          >
            + Add variant
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {variants.map((v, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2.5 rounded-xl border border-forest/10 bg-paper p-3 md:grid-cols-6 md:items-end">
              <div className="md:col-span-2">
                <label className={labelClass}>SKU</label>
                <input
                  value={v.sku}
                  onChange={(e) => setVariant(idx, { sku: e.target.value })}
                  placeholder="QLO-TEE-BULL-BLK-M"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Size</label>
                <select value={v.size} onChange={(e) => setVariant(idx, { size: e.target.value })} className={inputClass}>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Colour</label>
                <input value={v.color} onChange={(e) => setVariant(idx, { color: e.target.value })} placeholder="Black" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Price override (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.priceRupees}
                  onChange={(e) => setVariant(idx, { priceRupees: e.target.value })}
                  placeholder="Inherit"
                  className={inputClass}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className={labelClass}>Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => setVariant(idx, { stock: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  disabled={variants.length === 1}
                  className="mb-0.5 h-11 w-9 flex-none rounded-lg border border-forest/20 text-ink/50 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                  aria-label="Remove variant"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-full bg-forest px-8 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

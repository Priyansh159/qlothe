import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { getProductAdmin } from "@/services/admin";
import { ProductForm, type ProductFormInitial } from "@/components/admin/product-form";
import { VariantStockControl } from "@/components/admin/variant-stock-control";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit product · Admin" };

function paiseToRupees(paise: number | null): string {
  if (paise == null) return "";
  return (paise / 100).toString();
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const actor = await requireRole("MANAGER");
  const product = await getProductAdmin(actor, params.id);
  if (!product) notFound();

  const attrs = (product.attributes ?? {}) as Record<string, unknown>;

  const initial: ProductFormInitial = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? "",
    category: product.category,
    basePriceRupees: paiseToRupees(product.basePrice),
    isActive: product.isActive,
    fabric: typeof attrs.fabric === "string" ? attrs.fabric : "",
    gsm: attrs.gsm != null ? String(attrs.gsm) : "",
    fit: typeof attrs.fit === "string" ? attrs.fit : "",
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      priceRupees: paiseToRupees(v.price),
      stock: String(v.stock),
    })),
    images: product.images.map((img, i) => ({
      id: img.id,
      cloudinaryPublicId: img.cloudinaryPublicId,
      sortOrder: img.sortOrder ?? i,
    })),
  };

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-block text-sm font-semibold text-forest">
        ← All products
      </Link>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">Edit {product.name}</h1>

      <div className="mb-6 rounded-2xl border border-forest/15 bg-white p-5">
        <div className="mb-1 text-sm font-bold uppercase tracking-[.04em] text-ink/50">Quick stock adjustment</div>
        <p className="mb-4 text-xs text-ink/45">
          For stocktake corrections on an existing variant — requires a reason and is audited. To add a new
          variant or set its starting stock, use the form below instead.
        </p>
        <VariantStockControl
          variants={product.variants.map((v) => ({ id: v.id, sku: v.sku, size: v.size, color: v.color, stock: v.stock }))}
        />
      </div>

      <ProductForm initial={initial} />
    </div>
  );
}

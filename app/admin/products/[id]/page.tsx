import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductAdmin } from "@/services/admin";
import { ProductForm, type ProductFormInitial } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit product · Admin" };

function paiseToRupees(paise: number | null): string {
  if (paise == null) return "";
  return (paise / 100).toString();
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProductAdmin(params.id);
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
      <ProductForm initial={initial} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { getProductBySlug, listProducts } from "@/services/products";
import { ProductDetail, type DetailProduct } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? null;

  const detail: DetailProduct = {
    name: product.name,
    category: product.category,
    description: product.description,
    attributes: (product.attributes ?? {}) as Record<string, unknown>,
    images: product.images.map((i) => i.cloudinaryPublicId),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      price: v.price,
      inStock: v.inStock,
      lowStock: v.lowStock,
    })),
  };

  const { items: related } = await listProducts({
    category: product.category,
    sort: "new",
    page: 1,
    perPage: 5,
  });
  const relatedItems = related.filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <div className="animate-qfade">
      <ProductDetail product={detail} />

      {relatedItems.length > 0 ? (
        <section className="mx-auto w-full max-w-[1200px] px-[18px] py-8 md:px-12 md:py-[54px]">
          <h2 className="mb-[22px] font-serif text-[23px] font-semibold uppercase tracking-[.005em] text-forest md:text-[30px]">
            Wears well with
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-[26px]">
            {relatedItems.map((p) => (
              <ProductCard key={p.id} product={p} cloudName={cloudName} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  return { title: product?.name ?? "Product" };
}

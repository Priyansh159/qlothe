import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { productImageUrl } from "@/lib/images";
import { inr } from "@/lib/format";

export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number; // paise
  image: string | null; // cloudinary public id
  inStock: boolean;
};

export function ProductCard({ product, cloudName }: { product: ProductListItem; cloudName: string | null }) {
  return (
    <Link href={`/products/${product.slug}`} className="group flex cursor-pointer flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden border border-forest/10 bg-paper">
        <ProductImage
          src={productImageUrl(cloudName, product.image, 600)}
          alt={product.name}
          className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {!product.inStock ? (
          <div className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center bg-paper/60">
            <div className="bg-forest px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white">
              Sold out
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-2.5">
        <div className="text-xs font-semibold uppercase leading-[1.35] tracking-[.03em] text-ink">
          {product.name}
        </div>
        <span className="flex-none text-sm font-bold text-forest">{inr(product.price)}</span>
      </div>
    </Link>
  );
}

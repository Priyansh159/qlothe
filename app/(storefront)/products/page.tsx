import Link from "next/link";
import { Suspense } from "react";
import { listProducts } from "@/services/products";
import { productQuerySchema } from "@/lib/validation";
import { ProductCard } from "@/components/product-card";
import { FilterBar } from "@/components/filter-bar";
import { categoryName } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "All tees" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? null;
  const parsed = productQuerySchema.safeParse(searchParams);
  const query = parsed.success ? parsed.data : productQuerySchema.parse({});
  const { items, total, page, pages } = await listProducts(query);

  const title = query.category ? categoryName(query.category) : "All tees";

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    if (query.category) next.set("category", query.category);
    if (query.size) next.set("size", query.size);
    next.set("sort", query.sort);
    next.set("page", String(p));
    return `/products?${next.toString()}`;
  };

  return (
    <div className="animate-qfade">
      <div className="mx-auto w-full max-w-[1200px] px-[18px] pb-1 pt-7 md:px-12 md:pt-10">
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-forest/50">
          / Collection
        </div>
        <h1 className="m-0 font-serif text-[32px] font-semibold uppercase tracking-[.005em] text-forest md:text-[42px]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          {total} {total === 1 ? "style" : "styles"}
        </p>
      </div>

      <div className="mt-4">
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-[18px] py-8 md:px-12 md:py-[54px]">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-xl font-semibold text-forest">Nothing here yet</p>
            <p className="mt-2 text-sm text-ink/60">Try a different size or cut.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-[26px]">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} cloudName={cloudName} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <div className="mt-11 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-forest/20 text-forest hover:bg-forest/5"
              >
                ←
              </Link>
            ) : null}
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) =>
              p === page ? (
                <span
                  key={p}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-forest font-bold text-white"
                >
                  {p}
                </span>
              ) : (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-forest/20 text-forest hover:bg-forest/5"
                >
                  {p}
                </Link>
              ),
            )}
            {page < pages ? (
              <Link
                href={pageHref(page + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-forest/20 text-forest hover:bg-forest/5"
              >
                →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

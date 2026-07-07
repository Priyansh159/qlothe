import Link from "next/link";
import { listProductsAdmin } from "@/services/admin";
import { ProductImage } from "@/components/product-image";
import { productImageUrl } from "@/lib/images";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products · Admin" };

export default async function AdminProductsPage() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? null;
  const products = await listProductsAdmin();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest">Products</h1>
          <p className="mt-1 text-sm text-ink/55">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-pine"
        >
          + New product
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest/15 bg-white">
        {products.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink/50">No products yet — add your first one.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-forest/10 bg-paper text-xs font-bold uppercase tracking-[.04em] text-ink/50">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Base price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = p.variants.reduce((n, v) => n + v.stock, 0);
                return (
                  <tr key={p.id} className="border-b border-forest/10 last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-9 flex-none overflow-hidden rounded-md border border-forest/15 bg-paper">
                          <ProductImage
                            src={productImageUrl(cloudName, p.images[0]?.cloudinaryPublicId, 100)}
                            alt={p.name}
                            className="absolute inset-0 h-full w-full"
                          />
                        </div>
                        <div>
                          <Link href={`/admin/products/${p.id}`} className="font-semibold text-forest hover:underline">
                            {p.name}
                          </Link>
                          <div className="text-xs text-ink/45">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/60">{p.category}</td>
                    <td className="px-4 py-3 text-right font-semibold">{inr(p.basePrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={stock === 0 ? "font-semibold text-red-700" : "text-ink/70"}>{stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.04em] ${
                          p.isActive ? "bg-forest/10 text-forest" : "bg-ink/10 text-ink/50"
                        }`}
                      >
                        {p.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/products/${p.id}`} className="text-xs font-semibold text-forest underline underline-offset-4">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

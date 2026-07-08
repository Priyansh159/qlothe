import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product · Admin" };

export default async function NewProductPage() {
  await requireRole("MANAGER");
  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-block text-sm font-semibold text-forest">
        ← All products
      </Link>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">New product</h1>
      <ProductForm initial={null} />
    </div>
  );
}

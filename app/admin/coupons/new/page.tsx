import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata = { title: "New coupon · Admin" };

export default async function NewCouponPage() {
  await requireRole("MANAGER");
  return (
    <div>
      <Link href="/admin/coupons" className="mb-4 inline-block text-sm font-semibold text-forest">
        ← All coupons
      </Link>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">New coupon</h1>
      <CouponForm initial={null} />
    </div>
  );
}

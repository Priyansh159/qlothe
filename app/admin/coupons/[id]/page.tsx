import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { getCouponAdmin } from "@/services/admin";
import { CouponForm, type CouponFormInitial } from "@/components/admin/coupon-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit coupon · Admin" };

export default async function EditCouponPage({ params }: { params: { id: string } }) {
  const actor = await requireRole("MANAGER");
  const coupon = await getCouponAdmin(actor, params.id);
  if (!coupon) notFound();

  const initial: CouponFormInitial = {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    valueDisplay: coupon.type === "PERCENT" ? String(coupon.value) : (coupon.value / 100).toString(),
    minOrderRupees: (coupon.minOrder / 100).toString(),
    maxUses: coupon.maxUses != null ? String(coupon.maxUses) : "",
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : "",
    isActive: coupon.isActive,
  };

  return (
    <div>
      <Link href="/admin/coupons" className="mb-4 inline-block text-sm font-semibold text-forest">
        ← All coupons
      </Link>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">Edit {coupon.code}</h1>
      <CouponForm initial={initial} />
    </div>
  );
}

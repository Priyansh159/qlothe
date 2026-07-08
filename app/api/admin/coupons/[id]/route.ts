import { NextRequest, NextResponse } from "next/server";
import { couponUpdateSchema } from "@/lib/validation";
import { requireRole } from "@/lib/rbac";
import { updateCoupon } from "@/services/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireRole("MANAGER");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = couponUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  try {
    const coupon = await updateCoupon(actor, id, parsed.data);
    return NextResponse.json(coupon);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { couponCreateSchema } from "@/lib/validation";
import { requireRole } from "@/lib/rbac";
import { listCouponsAdmin, createCoupon } from "@/services/admin";

export async function GET() {
  let actor;
  try {
    actor = await requireRole("MANAGER");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }
  return NextResponse.json(await listCouponsAdmin(actor));
}

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireRole("MANAGER");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = couponCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const coupon = await createCoupon(actor, parsed.data);
    return NextResponse.json(coupon, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

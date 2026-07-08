import { NextRequest, NextResponse } from "next/server";
import { variantStockAdjustSchema } from "@/lib/validation";
import { requireRole } from "@/lib/rbac";
import { adjustVariantStock } from "@/services/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireRole("MANAGER");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = variantStockAdjustSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  try {
    const variant = await adjustVariantStock(actor, id, parsed.data.stock, parsed.data.reason);
    return NextResponse.json(variant);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

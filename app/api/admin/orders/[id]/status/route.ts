import { NextRequest, NextResponse } from "next/server";
import { orderStatusUpdateSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/services/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = orderStatusUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  try {
    const order = await updateOrderStatus(id, parsed.data.status, parsed.data.note);
    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

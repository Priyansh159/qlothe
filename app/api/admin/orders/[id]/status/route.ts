import { NextRequest, NextResponse } from "next/server";
import { orderStatusUpdateSchema } from "@/lib/validation";
import { requireRole } from "@/lib/rbac";
import { updateOrderStatus } from "@/services/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    // SUPPORT is the floor — updateOrderStatus() re-checks MANAGER for any
    // transition beyond SHIPPED/DELIVERED, per CLAUDE.md's "checks live in
    // services, never just hidden UI."
    actor = await requireRole("SUPPORT");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = orderStatusUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  try {
    const order = await updateOrderStatus(
      actor,
      id,
      parsed.data.status,
      parsed.data.note,
      parsed.data.awbNumber,
      parsed.data.courier,
    );
    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

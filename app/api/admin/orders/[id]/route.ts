import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { getOrderAdmin } from "@/services/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireRole("SUPPORT");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const { id } = await params;
  const order = await getOrderAdmin(actor, id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getUserOrder } from "@/services/orders";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const order = await getUserOrder(userId, id); // ownership enforced in query
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
}

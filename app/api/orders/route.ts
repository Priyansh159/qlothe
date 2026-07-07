import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { listUserOrders } from "@/services/orders";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await listUserOrders(userId));
  } catch {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
}

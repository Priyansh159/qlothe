import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { requireUserId, getCartToken } from "@/lib/auth";
import { getOrCreateCart } from "@/services/cart";
import { createOrder } from "@/services/checkout";
import { rateLimit, checkoutLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { success } = await rateLimit(checkoutLimiter, userId);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cart = await getOrCreateCart(userId, await getCartToken());
  try {
    const result = await createOrder(userId, cart.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

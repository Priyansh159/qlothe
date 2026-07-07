import { NextRequest, NextResponse } from "next/server";
import { cartItemSchema, cartUpdateSchema } from "@/lib/validation";
import { getUserId, getCartToken } from "@/lib/auth";
import { getOrCreateCart, getCartWithItems, addItem, updateItemQuantity } from "@/services/cart";

const CART_COOKIE = "qlothe_cart";
const cookieOpts = {
  httpOnly: true, secure: true, sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, path: "/",
};

async function resolveCart() {
  const [userId, token] = [await getUserId(), await getCartToken()];
  return getOrCreateCart(userId, token);
}

export async function GET() {
  const cart = await resolveCart();
  const res = NextResponse.json(await getCartWithItems(cart.id));
  res.cookies.set(CART_COOKIE, cart.id, cookieOpts);
  return res;
}

export async function POST(req: NextRequest) {
  const parsed = cartItemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const cart = await resolveCart();
  try {
    await addItem(cart.id, parsed.data.variantId, parsed.data.quantity);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
  const res = NextResponse.json(await getCartWithItems(cart.id), { status: 201 });
  res.cookies.set(CART_COOKIE, cart.id, cookieOpts);
  return res;
}

export async function PATCH(req: NextRequest) {
  const parsed = cartUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const cart = await resolveCart();
  await updateItemQuantity(cart.id, parsed.data.variantId, parsed.data.quantity);
  return NextResponse.json(await getCartWithItems(cart.id));
}

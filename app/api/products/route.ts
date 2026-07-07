import { NextRequest, NextResponse } from "next/server";
import { productQuerySchema } from "@/lib/validation";
import { listProducts } from "@/services/products";

export async function GET(req: NextRequest) {
  const parsed = productQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json(await listProducts(parsed.data));
}

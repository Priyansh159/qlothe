import { NextRequest, NextResponse } from "next/server";
import { productCreateSchema } from "@/lib/validation";
import { requireRole } from "@/lib/rbac";
import { createProduct } from "@/services/admin";

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireRole("MANAGER");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = productCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const product = await createProduct(actor, parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

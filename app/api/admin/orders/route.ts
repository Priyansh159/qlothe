import { NextRequest, NextResponse } from "next/server";
import { adminOrderQuerySchema } from "@/lib/validation";
import { requireRole } from "@/lib/rbac";
import { listOrdersAdmin } from "@/services/admin";

export async function GET(req: NextRequest) {
  let actor;
  try {
    actor = await requireRole("SUPPORT");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = adminOrderQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(await listOrdersAdmin(actor, parsed.data));
}

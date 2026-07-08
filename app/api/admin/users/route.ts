import { NextRequest, NextResponse } from "next/server";
import { adminUserQuerySchema, staffCreateSchema } from "@/lib/validation";
import { requireRole } from "@/lib/rbac";
import { listUsersAdmin, createStaffUser } from "@/services/admin";

export async function GET(req: NextRequest) {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = adminUserQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(await listUsersAdmin(actor, parsed.data));
}

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = staffCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const staff = await createStaffUser(actor, parsed.data);
    return NextResponse.json(staff, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

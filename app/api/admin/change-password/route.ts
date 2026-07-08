import { NextRequest, NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";
import { changeOwnPassword } from "@/services/auth";

// Any signed-in user (not admin-gated) — this exists to honor the
// mustChangePassword flag set on admin-created staff accounts, but the
// underlying action (change your own password) has no reason to require
// staff privileges.
export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = changePasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await changeOwnPassword(userId, parsed.data.newPassword);
  return NextResponse.json({ ok: true });
}

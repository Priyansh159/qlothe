import { NextRequest, NextResponse } from "next/server";
import { profileUpdateSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/auth";
import { getProfile, updateProfile } from "@/services/profile";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }
  return NextResponse.json(await getProfile(userId));
}

export async function PATCH(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = profileUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await updateProfile(userId, parsed.data);
    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

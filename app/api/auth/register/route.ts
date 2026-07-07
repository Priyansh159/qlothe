import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { registerUser } from "@/services/auth";
import { rateLimit, registerLimiter, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { success } = await rateLimit(registerLimiter, clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  }

  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await registerUser(parsed.data.email, parsed.data.password, parsed.data.name);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

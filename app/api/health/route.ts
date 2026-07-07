import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** UptimeRobot target — also keeps Neon warm on the free tier. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

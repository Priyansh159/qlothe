import { NextRequest, NextResponse } from "next/server";
import { releaseStaleOrders } from "@/services/checkout";

// Vercel Cron target — see vercel.json for the schedule (every 15 minutes).
// Vercel sends Authorization: Bearer $CRON_SECRET automatically.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await releaseStaleOrders());
}

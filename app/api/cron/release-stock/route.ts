import { NextRequest, NextResponse } from "next/server";
import { releaseStaleOrders } from "@/services/checkout";

// Vercel Cron target. Currently NOT scheduled — vercel.json has crons: []
// because the Hobby plan only allows daily (not every-15-min) schedules, and
// with Razorpay checkout disabled (COD-only storefront) there are no more
// PENDING orders left stranded to clean up, so this is low-risk to leave
// unscheduled for now. If Razorpay is re-enabled, either upgrade to Pro or
// point vercel.json at a once-daily schedule (e.g. "0 3 * * *") and this
// function will still correctly release anything stuck >30 min.
// Vercel sends Authorization: Bearer $CRON_SECRET automatically when it does run.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await releaseStaleOrders());
}

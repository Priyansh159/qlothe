import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmEmailChange } from "@/services/profile";

const querySchema = z.object({ token: z.string().trim().min(1) });

// This is the link clicked from the confirmation email, so it redirects to a
// page rather than returning JSON — no auth required here on purpose, the
// token itself (long, random, single-use, 30-min expiry) is the credential,
// same as a password-reset link.
export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  const base = new URL("/account", req.url);
  if (!parsed.success) {
    base.searchParams.set("emailChangeError", "Invalid link");
    return NextResponse.redirect(base);
  }

  try {
    const { email } = await confirmEmailChange(parsed.data.token);
    base.searchParams.set("emailChanged", email);
  } catch (e: any) {
    base.searchParams.set("emailChangeError", e.message ?? "Could not confirm this email change");
  }
  return NextResponse.redirect(base);
}

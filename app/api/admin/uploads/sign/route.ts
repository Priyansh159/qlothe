import { NextRequest, NextResponse } from "next/server";
import { uploadSignSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth";
import { generateUploadSignature } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = uploadSignSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(generateUploadSignature(parsed.data.folder));
}

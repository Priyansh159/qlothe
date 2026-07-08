import { NextRequest, NextResponse } from "next/server";
import { uploadSignSchema } from "@/lib/validation";
import { requireRole } from "@/lib/rbac";
import { generateUploadSignature } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await requireRole("MANAGER"); // catalog images are a MANAGER concern, same as product CRUD
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const parsed = uploadSignSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(generateUploadSignature(parsed.data.folder));
}

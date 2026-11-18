import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/services/authService";
import { getPublishedSnapshot, publishVersion } from "@/services/pricingService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({ note: "" }));
  const note = String(body.note ?? "").slice(0, 240);

  try {
    const snapshot = await publishVersion(note || "Price update", admin);
    return NextResponse.json({ ok: true, snapshot });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const snapshot = await getPublishedSnapshot();
  return NextResponse.json({ ok: true, snapshot, admin });
}

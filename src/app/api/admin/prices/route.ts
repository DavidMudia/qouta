import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/services/authService";
import { updateCategoryPrice, updateFeaturePrice } from "@/services/pricingService";

export const dynamic = "force-dynamic";

/**
 * Editing a working price does NOT change what customers see — the customer
 * price only moves when a new version is published from /admin.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const price = Math.round(Number(body.price));
  const kind = body.kind === "category" ? "category" : "feature";

  if (!Number.isFinite(id) || !Number.isFinite(price) || price < 0 || price > 50_000_000) {
    return NextResponse.json({ ok: false, error: "Invalid price." }, { status: 422 });
  }

  try {
    if (kind === "category") await updateCategoryPrice(id, price);
    else await updateFeaturePrice(id, price);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

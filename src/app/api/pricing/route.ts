import { NextResponse } from "next/server";
import { getPublishedSnapshot } from "@/services/pricingService";

export const dynamic = "force-dynamic";

/** Public read of the currently published price configuration. */
export async function GET() {
  try {
    const snapshot = await getPublishedSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Pricing unavailable", detail: String(err) },
      { status: 500 },
    );
  }
}

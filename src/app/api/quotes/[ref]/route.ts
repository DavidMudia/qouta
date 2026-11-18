import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customerSubmissions } from "@/db/schema";
import { getPublishedSnapshot } from "@/services/pricingService";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ ref: string }> },
) {
  const { ref } = await ctx.params;
  const clean = String(ref).slice(0, 24);

  try {
    const [row] = await db
      .select()
      .from(customerSubmissions)
      .where(eq(customerSubmissions.ref, clean))
      .limit(1);

    const snapshot = await getPublishedSnapshot();

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "not_found", liveVersion: snapshot.version },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      row,
      liveVersion: snapshot.version,
      livePublishedAt: snapshot.publishedAt,
      categoryLabel:
        snapshot.categories.find((c) => c.code === row.categoryCode)?.name ?? row.categoryCode,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err), liveVersion: null },
      { status: 500 },
    );
  }
}

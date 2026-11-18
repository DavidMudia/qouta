import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  createSubmission,
  listSubmissions,
  validateSubmission,
} from "@/services/submissionService";
import { requireAdmin } from "@/services/authService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const payload = {
    name: String(input.name ?? ""),
    email: String(input.email ?? ""),
    phone: String(input.phone ?? ""),
    company: String(input.company ?? ""),
    answers: (input.answers ?? {}) as never,
    claimedSubtotal:
      typeof input.claimedSubtotal === "number" ? input.claimedSubtotal : undefined,
    source: input.source === "offline" ? ("offline" as const) : ("web" as const),
  };

  const problem = validateSubmission(payload);
  if (problem) {
    return NextResponse.json({ ok: false, error: problem }, { status: 422 });
  }

  try {
    const { row, estimate } = await createSubmission(payload);
    return NextResponse.json({
      ok: true,
      ref: row.ref,
      estimate: {
        lineItems: estimate.lineItems,
        subtotal: estimate.subtotal,
        estimateMin: estimate.estimateMin,
        estimateMax: estimate.estimateMax,
        version: estimate.version,
        publishedAt: estimate.publishedAt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Could not save the request.", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const rows = await listSubmissions();
  return NextResponse.json({ ok: true, rows });
}

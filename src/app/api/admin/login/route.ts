import { NextResponse, type NextRequest } from "next/server";
import { issueSession, setSessionCookie } from "@/lib/session";
import { loginAdmin, devCredentialsHint } from "@/services/authService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password || password.length > 200) {
    return NextResponse.json({ ok: false, error: "Email and password required." }, { status: 400 });
  }

  const admin = await loginAdmin(email, password);
  if (!admin) {
    // Constant-shape failure: no hint about which half was wrong.
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  await setSessionCookie(issueSession(admin));
  return NextResponse.json({ ok: true, email: admin });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: devCredentialsHint });
}

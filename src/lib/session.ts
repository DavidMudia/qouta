import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "mwq_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function secret(): string {
  // Server-side only. Never referenced by client code.
  return process.env.SESSION_SECRET || process.env.DATABASE_URL || "mwq-local-dev-secret";
}

export function hashPassword(password: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString("hex");
  const digest = scryptSync(password, s, 64).toString("hex");
  return `s2$${s}$${digest}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "s2") return false;
  const digest = scryptSync(password, parts[1], 64);
  const expected = Buffer.from(parts[2], "hex");
  return expected.length === digest.length && timingSafeEqual(digest, expected);
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function issueSession(email: string): string {
  const exp = String(Date.now() + SESSION_TTL_MS);
  return `${exp}.${sign(`${exp}.${email}`)}.${Buffer.from(email).toString("base64url")}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const [exp, sig, emailB64] = token.split(".");
  if (!exp || !sig || !emailB64) return null;
  if (Number(exp) < Date.now()) return null;
  const expected = sign(`${exp}.${Buffer.from(emailB64, "base64url").toString()}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Buffer.from(emailB64, "base64url").toString();
}

/** RLS-equivalent gate: every admin route calls this before touching data. */
export async function currentAdmin(): Promise<string | null> {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAccounts } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/session";

/**
 * Authentication (who are you) vs authorization (what may you do).
 * Authorization is decided server-side — hiding routes in React is not a
 * control we rely on anywhere.
 */

const DEV_EMAIL = process.env.ADMIN_EMAIL || "dev@mudia.ng";
const DEV_PASSWORD = process.env.ADMIN_PASSWORD || "webquote-dev-2026";

export const devCredentialsHint = {
  email: DEV_EMAIL,
  password: process.env.ADMIN_PASSWORD ? null : DEV_PASSWORD,
};

type Globals = { mwqAdminSeed?: Promise<void> };
const g = globalThis as Globals;

export function ensureAdminSeeded(): Promise<void> {
  if (!g.mwqAdminSeed) {
    g.mwqAdminSeed = (async () => {
      try {
        const rows = await db.select({ id: adminAccounts.id }).from(adminAccounts).limit(1);
        if (rows.length === 0) {
          await db.insert(adminAccounts).values({
            email: DEV_EMAIL,
            passwordHash: hashPassword(DEV_PASSWORD),
            displayName: "Mudia developer",
          });
        }
      } catch {
        // Development fallback: the signed-in session can still be validated
        // from SESSION_SECRET when PostgreSQL is unavailable.
      }
    })();
  }
  return g.mwqAdminSeed;
}

export async function loginAdmin(email: string, password: string): Promise<string | null> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    await ensureAdminSeeded();
    const [admin] = await db
      .select()
      .from(adminAccounts)
      .where(eq(adminAccounts.email, cleanEmail));
    if (admin && verifyPassword(password, admin.passwordHash)) return admin.email;
  } catch {
    // Continue to environment credentials below.
  }

  if (
    cleanEmail === DEV_EMAIL.trim().toLowerCase() &&
    password === DEV_PASSWORD
  ) {
    return DEV_EMAIL;
  }

  return null;
}

export async function requireAdmin(): Promise<string | null> {
  const { currentAdmin } = await import("@/lib/session");
  const email = await currentAdmin();
  if (!email) return null;

  if (email.toLowerCase() === DEV_EMAIL.trim().toLowerCase()) {
    return email;
  }

  try {
    const [admin] = await db
      .select({ email: adminAccounts.email })
      .from(adminAccounts)
      .where(eq(adminAccounts.email, email));
    return admin?.email ?? null;
  } catch {
    return null;
  }
}

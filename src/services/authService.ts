import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAccounts } from "@/db/schema";
import { verifyPassword } from "@/lib/session";

/**
 * Hard allowlist of admin emails. This makes Qouta a single-owner product:
 * even if a row exists in admin_accounts, login and session checks reject
 * any email not on this list. To add/remove an owner, change ADMIN_EMAILS
 * (comma-separated), not the database.
 *
 * Defaults to the product owner if the env var is unset.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "oyedohosemudiamen@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAuthorizedAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<string | null> {
  const cleanEmail = email.trim().toLowerCase();

  // Hard gate BEFORE the database — no allowlist, no login attempt
  if (!isAuthorizedAdmin(cleanEmail)) return null;

  const [admin] = await db
    .select()
    .from(adminAccounts)
    .where(eq(adminAccounts.email, cleanEmail));
  if (!admin) return null;
  return verifyPassword(password, admin.passwordHash) ? admin.email : null;
}

export async function requireAdmin(): Promise<string | null> {
  const { currentAdmin } = await import("@/lib/session");
  const email = await currentAdmin();
  if (!email) return null;

  // A valid signed session for a non-allowlisted email is rejected too
  if (!isAuthorizedAdmin(email)) return null;

  try {
    const [admin] = await db
      .select({ email: adminAccounts.email })
      .from(adminAccounts)
      .where(eq(adminAccounts.email, email.toLowerCase()));
    return admin?.email ?? null;
  } catch {
    return null;
  }
}
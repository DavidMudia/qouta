import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAccounts } from "@/db/schema";
import { verifyPassword } from "@/lib/session";

export async function loginAdmin(
  email: string,
  password: string,
): Promise<string | null> {
  const cleanEmail = email.trim().toLowerCase();
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
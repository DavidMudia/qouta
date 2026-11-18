import { randomBytes } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerSubmissions } from "@/db/schema";
import { assessRequirements } from "@/engine/assessment";
import { computeEstimate } from "@/engine/pricing";
import { normalise, type Answers } from "@/engine/requirements";
import { getPublishedSnapshot } from "./pricingService";

export type SubmissionInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  answers: Partial<Answers>;
  claimedSubtotal?: number;
  source?: "web" | "offline";
};

export type SubmissionRecord = Awaited<ReturnType<typeof createSubmission>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}\p{M} .,'-]{1,80}$/u;

/** Naive in-process limiter — one submission per IP per 30s. */
const recent = new Map<string, number>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > 60000) recent.delete(k);
  const last = recent.get(key);
  if (last && now - last < 30000) return true;
  recent.set(key, now);
  return false;
}

export async function createSubmission(input: SubmissionInput) {
  const answers = normalise(input.answers);
  const snapshot = await getPublishedSnapshot();

  // The browser's arithmetic is treated as a claim, never as the truth.
  const assessment = assessRequirements(answers);
  const estimate = computeEstimate(answers, snapshot);
  const mismatch =
    typeof input.claimedSubtotal === "number" &&
    input.claimedSubtotal !== estimate.subtotal;

  const ref = `MWQ-${randomBytes(4).toString("hex").toUpperCase()}`;

  const [row] = await db
    .insert(customerSubmissions)
    .values({
      ref,
      name: input.name,
      email: input.email,
      phone: input.phone ?? "",
      company: input.company ?? "",
      categoryCode: answers.category,
      pages: answers.pages,
      answers,
      assessment: assessment.assessment,
      lineItems: estimate.lineItems,
      subtotal: estimate.subtotal,
      estimateMin: estimate.estimateMin,
      estimateMax: estimate.estimateMax,
      claimedSubtotal: input.claimedSubtotal ?? null,
      pricingVersion: snapshot.version,
      mismatch,
      source: input.source ?? "web",
    })
    .returning();

  return { row, answers, estimate, assessment: assessment.assessment, snapshot };
}

export function validateSubmission(input: SubmissionInput): string | null {
  if (!NAME_RE.test(input.name?.trim() ?? "")) return "Enter a valid name.";
  if (!EMAIL_RE.test(input.email?.trim() ?? "")) return "Enter a valid email address.";
  if ((input.phone ?? "").length > 40) return "Phone number is too long.";
  if (typeof input.claimedSubtotal === "number" && input.claimedSubtotal < 0)
    return "Invalid estimate payload.";
  return null;
}

export function checkRateLimit(ip: string): boolean {
  return !rateLimited(ip);
}

export async function listSubmissions() {
  return db
    .select()
    .from(customerSubmissions)
    .orderBy(desc(customerSubmissions.createdAt))
    .limit(100);
}

export async function setSubmissionStatus(ref: string, status: string) {
  await db.update(customerSubmissions).set({ status }).where(eq(customerSubmissions.ref, ref));
}

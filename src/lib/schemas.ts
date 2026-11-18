import { z } from "zod";
import { CATEGORY_CODES, normalise } from "@/engine/requirements";

/* ------------------------------------------------------------------ *
 * Answers — the customer's input, normalised at the boundary.
 * .transform(normalise) means callers get a canonical Answers object
 * regardless of what the browser sent. No route should call
 * computeEstimate without going through this schema first.
 * ------------------------------------------------------------------ */
export const AnswersSchema = z
  .object({
    category: z.enum(CATEGORY_CODES),
    pages: z.number().int().min(1).max(60),
    outcomes: z.array(
      z.enum([
        "readInfo",
        "contactForm",
        "accounts",
        "payments",
        "bookings",
        "orderTracking",
        "fileUploads",
      ]),
    ),
    operations: z.array(
      z.enum(["contentTeam", "staffConsole", "staffRoles"]),
    ),
    channels: z.array(z.enum(["whatsapp", "whatsappApi", "newsletter"])),
    timeline: z.enum(["standard", "fast", "rush"]),
  })
  .transform((a) => normalise(a));

/* ------------------------------------------------------------------ *
 * Pricing snapshot — parsed before insert (publish) and after select
 * (getPublishedSnapshot). Rejects malformed configs at the source.
 * ------------------------------------------------------------------ */
const PricingCategorySchema = z.object({
  id: z.number().int().optional(),
  code: z.enum(CATEGORY_CODES),
  name: z.string().min(1),
  blurb: z.string(),
  startingPrice: z.number().int().nonnegative(),
});

const PricingFeatureSchema = z.object({
  id: z.number().int().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  billableGroup: z.string().min(1),
  billing: z.enum(["fixed", "per_unit"]),
});

export const SnapshotSchema = z.object({
  version: z.number().int().positive(),
  publishedAt: z.string().min(1),
  note: z.string(),
  categories: z.array(PricingCategorySchema).min(1),
  features: z.array(PricingFeatureSchema).min(1),
  includedPages: z.number().int().nonnegative(),
  rangeFactor: z.number().min(1),
  rushRates: z.object({
    standard: z.number().nonnegative(),
    fast: z.number().nonnegative(),
    rush: z.number().nonnegative(),
  }),
});

/* ------------------------------------------------------------------ *
 * Submission body — starting point for /api/submissions.
 * Refine once you've read submissionService.ts.
 * ------------------------------------------------------------------ */
export const SubmissionBodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(40).optional().default(""),
  company: z.string().max(200).optional().default(""),
  answers: AnswersSchema,
  claimedSubtotal: z.number().int().nonnegative().optional(),
  pricingVersion: z.number().int().positive().optional(),
  source: z.enum(["web", "pwa", "admin"]).optional().default("web"),
});
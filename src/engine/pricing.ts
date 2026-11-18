import { assessRequirements } from "./assessment";
import { formatNaira as formatCurrency } from "../lib/format";
import type { Answers, CategoryCode, TimelineCode } from "./requirements";

export { formatNaira } from "../lib/format";

/* ------------------------------------------------------------------ *
 * Pricing configuration — the same shape that lives in pricing_versions
 * ------------------------------------------------------------------ */

export type PricingCategory = {
  id?: number;
  code: CategoryCode;
  name: string;
  blurb: string;
  startingPrice: number;
};

export type PricingFeature = {
  id?: number;
  code: string;
  name: string;
  price: number;
  billableGroup: string;
  billing: "fixed" | "per_unit";
};

export type PricingSnapshot = {
  version: number;
  publishedAt: string;
  note: string;
  categories: PricingCategory[];
  features: PricingFeature[];
  includedPages: number;
  rangeFactor: number;
  rushRates: Record<TimelineCode, number>;
};

export type LineItem = {
  code: string;
  label: string;
  detail: string;
  group: string;
  amount: number;
  qty?: number;
  unitPrice?: number;
};

export type Estimate = {
  lineItems: LineItem[];
  subtotal: number;
  estimateMin: number;
  estimateMax: number;
  rushRate: number;
  version: number;
  publishedAt: string;
};

export function featureMap(snapshot: PricingSnapshot) {
  return new Map(snapshot.features.map((f) => [f.code, f]));
}

/**
 * Produces one billable line per answer, then collapses lines that belong to
 * the same functionality into their most expensive representative so nobody is
 * charged twice for the same thing (e.g. a WhatsApp button plus a WhatsApp
 * integration is ONE WhatsApp line, not two).
 */
export function computeEstimate(
  answers: Answers,
  snapshot: PricingSnapshot,
): Estimate {
  const { assessment } = assessRequirements(answers);
  const features = featureMap(snapshot);
  const priceOf = (code: string) => features.get(code)?.price ?? 0;
  const nameOf = (code: string) => features.get(code)?.name ?? code;

  const candidates: LineItem[] = [];

  // 1. Base category
  const category = snapshot.categories.find((c) => c.code === answers.category);
  if (category) {
    candidates.push({
      code: `base:${category.code}`,
      label: category.name,
      detail: category.blurb,
      group: "base",
      amount: category.startingPrice,
    });
  }

  // 2. Pages beyond the included allowance
  const extraPages = Math.max(0, answers.pages - snapshot.includedPages);
  if (extraPages > 0) {
    candidates.push({
      code: "additionalPage",
      label: `${extraPages} additional page${extraPages > 1 ? "s" : ""}`,
      detail: `${snapshot.includedPages} pages included in the base price`,
      group: "pages",
      amount: extraPages * priceOf("additionalPage"),
      qty: extraPages,
      unitPrice: priceOf("additionalPage"),
    });
  }

  // 3. Derived platform requirements
  if (assessment.backendRequired) {
    candidates.push({
      code: "backend",
      label: nameOf("backend"),
      detail: "Server-side logic, form handling and protected routes",
      group: "backend",
      amount: priceOf("backend"),
    });
  }
  if (assessment.authenticationRequired) {
    candidates.push({
      code: "login",
      label: nameOf("login"),
      detail: "Registration, sign-in and password recovery",
      group: "auth",
      amount: priceOf("login"),
    });
  }
  if (assessment.paymentIntegrationRequired) {
    candidates.push({
      code: "payments",
      label: nameOf("payments"),
      detail: "Gateway integration and transaction verification",
      group: "payments",
      amount: priceOf("payments"),
    });
  }
  if (answers.outcomes.includes("orderTracking") || answers.operations.includes("staffConsole")) {
    candidates.push({
      code: "dashboard",
      label: nameOf("dashboard"),
      detail: "Private console for orders, bookings or member records",
      group: "dashboard",
      amount: priceOf("dashboard"),
    });
  }
  if (assessment.roleBasedAccessRequired) {
    candidates.push({
      code: "staffPermissions",
      label: nameOf("staffPermissions"),
      detail: "Roles and permissions enforced on the server",
      group: "rbac",
      amount: priceOf("staffPermissions"),
    });
  }

  // 4. Contact channels (grouped, never double-charged)
  const channelCodes = (["whatsapp", "whatsappApi", "newsletter"] as const).filter(
    (c) => answers.channels.includes(c),
  );
  const byGroup = new Map<string, LineItem[]>();
  for (const code of channelCodes) {
    const item: LineItem = {
      code,
      label: nameOf(code),
      detail:
        code === "whatsapp"
          ? "Tap-to-chat button on every page"
          : code === "whatsappApi"
            ? "Order alerts and auto-replies, button included"
            : "Sign-up form and campaign sending",
      group: features.get(code)?.billableGroup ?? "misc",
      amount: priceOf(code),
    };
    const list = byGroup.get(item.group) ?? [];
    list.push(item);
    byGroup.set(item.group, list);
  }
  for (const [group, items] of byGroup) {
    const winner = items.reduce((a, b) => (b.amount > a.amount ? b : a));
    const merged =
      items.length > 1
        ? { ...winner, label: winner.label, detail: `${items.map((i) => i.label).join(" + ")} — billed once` }
        : winner;
    candidates.push({ ...merged, group });
  }

  // 5. Timeline uplift
  const rushRate = snapshot.rushRates[answers.timeline] ?? 0;

  // Group collapse: highest amount wins inside each billable group
  const collapsed = new Map<string, LineItem>();
  for (const item of candidates) {
    const existing = collapsed.get(item.group);
    if (!existing || item.amount > existing.amount) collapsed.set(item.group, item);
  }

  const baseSubtotal = Array.from(collapsed.values()).reduce(
    (sum, i) => sum + i.amount,
    0,
  );
  // rushRate is stored as a whole-number percent (20 = +20%), rounded to ₦100.
  const rushAmount =
    rushRate > 0 ? Math.round((baseSubtotal * rushRate) / 100 / 100) * 100 : 0;

  const lineItems = Array.from(collapsed.values());
  if (rushAmount > 0) {
    lineItems.push({
      code: "rush",
      label: answers.timeline === "rush" ? "Rush delivery" : "Accelerated delivery",
      detail: `${Math.round(rushRate)}% uplift on ${formatCurrency(baseSubtotal)}`,
      group: "rush",
      amount: rushAmount,
    });
  }

  const subtotal = baseSubtotal + rushAmount;

  return {
    lineItems,
    subtotal,
    estimateMin: subtotal,
    estimateMax: Math.round(subtotal * snapshot.rangeFactor),
    rushRate,
    version: snapshot.version,
    publishedAt: snapshot.publishedAt,
  };
}

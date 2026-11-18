import { describe, it, expect } from "vitest";
import { computeEstimate, type PricingSnapshot } from "../pricing";
import type { Answers } from "../requirements";

const snapshot: PricingSnapshot = {
  version: 7,
  publishedAt: "2025-01-01T00:00:00.000Z",
  note: "test fixture",
  includedPages: 5,
  rangeFactor: 1.25,
  rushRates: { standard: 0, fast: 10, rush: 20 },
  categories: [
    { code: "landingPage", name: "Landing page", blurb: "", startingPrice: 80000 },
    { code: "portfolio", name: "Portfolio", blurb: "", startingPrice: 120000 },
    { code: "business", name: "Business site", blurb: "", startingPrice: 180000 },
    { code: "ecommerce", name: "E-commerce", blurb: "", startingPrice: 320000 },
  ],
  features: [
    { code: "additionalPage", name: "Additional page", price: 12000, billableGroup: "pages", billing: "per_unit" },
    { code: "backend", name: "Server-side backend", price: 80000, billableGroup: "backend", billing: "fixed" },
    { code: "login", name: "Accounts and login", price: 60000, billableGroup: "auth", billing: "fixed" },
    { code: "payments", name: "Payment integration", price: 90000, billableGroup: "payments", billing: "fixed" },
    { code: "dashboard", name: "Staff dashboard", price: 70000, billableGroup: "dashboard", billing: "fixed" },
    { code: "staffPermissions", name: "Roles and permissions", price: 40000, billableGroup: "rbac", billing: "fixed" },
    { code: "whatsapp", name: "WhatsApp button", price: 15000, billableGroup: "whatsapp", billing: "fixed" },
    { code: "whatsappApi", name: "WhatsApp API", price: 45000, billableGroup: "whatsapp", billing: "fixed" },
    { code: "newsletter", name: "Newsletter signup", price: 20000, billableGroup: "newsletter", billing: "fixed" },
  ],
};

const base: Answers = {
  category: "business",
  pages: 5,
  outcomes: [],
  operations: [],
  channels: [],
  timeline: "standard",
};

describe("computeEstimate", () => {
  it("charges the base category alone when nothing else is selected", () => {
    const e = computeEstimate(base, snapshot);
    expect(e.subtotal).toBe(180000);
    expect(e.lineItems).toHaveLength(1);
    expect(e.lineItems[0].code).toBe("base:business");
  });

  it("does not charge extra pages at exactly includedPages", () => {
    expect(computeEstimate({ ...base, pages: 5 }, snapshot).subtotal).toBe(180000);
  });

  it("charges one additional page at includedPages + 1", () => {
    const e = computeEstimate({ ...base, pages: 6 }, snapshot);
    expect(e.subtotal).toBe(180000 + 12000);
    const line = e.lineItems.find((l) => l.code === "additionalPage");
    expect(line?.qty).toBe(1);
    expect(line?.unitPrice).toBe(12000);
  });

  it("charges N additional pages at includedPages + N", () => {
    expect(computeEstimate({ ...base, pages: 8 }, snapshot).subtotal).toBe(
      180000 + 3 * 12000,
    );
  });

  it("collapses whatsapp + whatsappApi into one line at the higher price", () => {
    const e = computeEstimate(
      { ...base, channels: ["whatsapp", "whatsappApi"] },
      snapshot,
    );
    const whatsappLines = e.lineItems.filter((l) => l.group === "whatsapp");
    expect(whatsappLines).toHaveLength(1);
    expect(whatsappLines[0].code).toBe("whatsappApi");
    expect(e.subtotal).toBe(180000 + 45000);
  });

  it("applies rush uplift rounded to ₦100", () => {
    const e = computeEstimate({ ...base, timeline: "rush" }, snapshot);
    const expectedRush = Math.round((180000 * 20) / 100 / 100) * 100;
    expect(e.subtotal).toBe(180000 + expectedRush);
    expect(e.lineItems.some((l) => l.code === "rush")).toBe(true);
  });

  it("reports version and publishedAt from the snapshot", () => {
    const e = computeEstimate(base, snapshot);
    expect(e.version).toBe(7);
    expect(e.publishedAt).toBe("2025-01-01T00:00:00.000Z");
  });

  it("returns estimateMax = subtotal × rangeFactor", () => {
    const e = computeEstimate(base, snapshot);
    expect(e.estimateMax).toBe(Math.round(180000 * 1.25));
  });
});
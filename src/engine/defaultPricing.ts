import type { PricingSnapshot } from "./pricing";

/** The configuration a fresh install starts from (and the offline fallback). */
export const DEFAULT_SNAPSHOT: PricingSnapshot = {
  version: 1,
  publishedAt: "2026-01-05T09:00:00.000Z",
  note: "Opening price list",
  includedPages: 5,
  rangeFactor: 1.25,
  rushRates: { standard: 0, fast: 10, rush: 20 },
  categories: [
    { code: "landingPage", name: "Landing page", blurb: "One page, one purpose", startingPrice: 50000 },
    { code: "portfolio", name: "Portfolio", blurb: "Work, case studies, about", startingPrice: 65000 },
    { code: "business", name: "Business website", blurb: "The full company presence", startingPrice: 85000 },
    { code: "ecommerce", name: "Ecommerce", blurb: "Catalogue, cart, checkout", startingPrice: 150000 },
  ],
  features: [
    { code: "additionalPage", name: "Additional page", price: 7000, billableGroup: "pages", billing: "per_unit" },
    { code: "backend", name: "Backend", price: 60000, billableGroup: "backend", billing: "fixed" },
    { code: "login", name: "Login system", price: 45000, billableGroup: "auth", billing: "fixed" },
    { code: "payments", name: "Payment integration", price: 45000, billableGroup: "payments", billing: "fixed" },
    { code: "dashboard", name: "Dashboard", price: 65000, billableGroup: "dashboard", billing: "fixed" },
    { code: "whatsapp", name: "WhatsApp button", price: 5000, billableGroup: "messaging", billing: "fixed" },
    { code: "whatsappApi", name: "WhatsApp integration", price: 12000, billableGroup: "messaging", billing: "fixed" },
    { code: "newsletter", name: "Newsletter sign-up", price: 8000, billableGroup: "email", billing: "fixed" },
    { code: "staffPermissions", name: "Staff permissions", price: 15000, billableGroup: "rbac", billing: "fixed" },
  ],
};

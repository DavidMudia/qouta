/**
 * The vocabulary the CUSTOMER speaks.
 * Nothing in this file mentions servers, databases or APIs — the engine
 * translates these answers into technical requirements later.
 */

export const CATEGORY_CODES = [
  "landingPage",
  "portfolio",
  "business",
  "ecommerce",
] as const;
export type CategoryCode = (typeof CATEGORY_CODES)[number];

export type TimelineCode = "standard" | "fast" | "rush";

export type OutcomeCode =
  | "readInfo"
  | "contactForm"
  | "accounts"
  | "payments"
  | "bookings"
  | "orderTracking"
  | "fileUploads";

export type OperationCode = "contentTeam" | "staffConsole" | "staffRoles";

export type ChannelCode = "whatsapp" | "whatsappApi" | "newsletter";

export type Answers = {
  category: CategoryCode;
  pages: number;
  outcomes: OutcomeCode[];
  operations: OperationCode[];
  channels: ChannelCode[];
  timeline: TimelineCode;
};

export type Option<T extends string> = {
  code: T;
  label: string;
  hint: string;
};

/* ------------------------------------------------------------------ *
 * Step 1 — what kind of site
 * ------------------------------------------------------------------ */
export const CATEGORIES: Option<CategoryCode>[] = [
  {
    code: "landingPage",
    label: "A single-page introduction",
    hint: "One focused page: what you do, proof, and how to reach you.",
  },
  {
    code: "portfolio",
    label: "A body of work",
    hint: "Gallery of projects, case studies, about page, contact.",
  },
  {
    code: "business",
    label: "A full business website",
    hint: "Services, team, testimonials, news, and the rest of the company.",
  },
  {
    code: "ecommerce",
    label: "A shop that sells online",
    hint: "Product catalogue, cart, checkout and order handling.",
  },
];

/* ------------------------------------------------------------------ *
 * Step 2 — how much there is to say
 * ------------------------------------------------------------------ */
export const PAGE_PRESETS = [
  { pages: 3, label: "About 3 pages" },
  { pages: 5, label: "About 5 pages" },
  { pages: 8, label: "About 8 pages" },
  { pages: 12, label: "About 12 pages" },
  { pages: 20, label: "20+ pages" },
] as const;

/* ------------------------------------------------------------------ *
 * Step 3 — what visitors should be able to DO
 * ------------------------------------------------------------------ */
export const OUTCOMES: Option<OutcomeCode>[] = [
  {
    code: "readInfo",
    label: "Read about your business",
    hint: "Pages, images, services — the usual brochure material.",
  },
  {
    code: "contactForm",
    label: "Send you a message",
    hint: "A contact form that lands in your inbox.",
  },
  {
    code: "accounts",
    label: "Create an account and sign in",
    hint: "Personal profiles each visitor can log into.",
  },
  {
    code: "payments",
    label: "Pay you online",
    hint: "Cards, bank transfer or USSD at checkout.",
  },
  {
    code: "bookings",
    label: "Book an appointment or reserve a date",
    hint: "A calendar with available slots.",
  },
  {
    code: "orderTracking",
    label: "Track their orders or bookings",
    hint: "A private page showing status and history.",
  },
  {
    code: "fileUploads",
    label: "Upload documents or files",
    hint: "Invoices, briefs, ID cards — stored safely.",
  },
];

/* ------------------------------------------------------------------ *
 * Step 4 — how you run things behind the scenes
 * ------------------------------------------------------------------ */
export const OPERATIONS: Option<OperationCode>[] = [
  {
    code: "contentTeam",
    label: "Staff update the site regularly",
    hint: "Someone other than us publishes news, services or products.",
  },
  {
    code: "staffConsole",
    label: "Staff manage customers in one place",
    hint: "A private console for orders, bookings or member records.",
  },
  {
    code: "staffRoles",
    label: "Different staff see different things",
    hint: "Roles and permissions — a cashier cannot touch the admin tools.",
  },
];

/* ------------------------------------------------------------------ *
 * Step 5 — contact channels
 * ------------------------------------------------------------------ */
export const CHANNELS: Option<ChannelCode>[] = [
  {
    code: "whatsapp",
    label: "A WhatsApp chat button",
    hint: "One tap opens a chat with your business number.",
  },
  {
    code: "whatsappApi",
    label: "WhatsApp integration",
    hint: "Order alerts and auto-replies from the site itself.",
  },
  {
    code: "newsletter",
    label: "An email newsletter sign-up",
    hint: "Collect addresses and send campaigns.",
  },
];

export const TIMELINES: Option<TimelineCode>[] = [
  { code: "standard", label: "Standard delivery", hint: "4–6 weeks, no rush fee." },
  { code: "fast", label: "Move quickly", hint: "About 3 weeks. +10%." },
  { code: "rush", label: "As soon as possible", hint: "About 10 days. +20%." },
];

export const EMPTY_ANSWERS: Answers = {
  category: "business",
  pages: 5,
  outcomes: ["readInfo", "contactForm"],
  operations: [],
  channels: [],
  timeline: "standard",
};

/** Includes selections a customer would never think to switch off. */
export function normalise(answers: Partial<Answers> | null | undefined): Answers {
  const a = { ...EMPTY_ANSWERS, ...(answers ?? {}) };
  return {
    category: CATEGORY_CODES.includes(a.category) ? a.category : "business",
    pages: Math.min(60, Math.max(1, Math.round(Number(a.pages) || 5))),
    outcomes: Array.from(new Set(a.outcomes ?? [])).filter((c) =>
      OUTCOMES.some((o) => o.code === c),
    ),
    operations: Array.from(new Set(a.operations ?? [])).filter((c) =>
      OPERATIONS.some((o) => o.code === c),
    ),
    channels: Array.from(new Set(a.channels ?? [])).filter((c) =>
      CHANNELS.some((o) => o.code === c),
    ),
    timeline: ["standard", "fast", "rush"].includes(a.timeline)
      ? a.timeline
      : "standard",
  };
}

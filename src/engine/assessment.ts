import type { Answers } from "./requirements";

/**
 * Rule-based inference engine.
 * Customer answers in, technical architecture out — with a printed trace so a
 * human can audit exactly why a conclusion was reached.
 */

export type TechnicalAssessment = {
  backendRequired: boolean;
  databaseRequired: boolean;
  authenticationRequired: boolean;
  paymentIntegrationRequired: boolean;
  roleBasedAccessRequired: boolean;
  fileStorageRequired: boolean;
  bookingEngineRequired: boolean;
  cmsRequired: boolean;
  thirdPartyServices: string[];
  derived: RequirementCode[];
};

export type RequirementCode =
  | "backend"
  | "database"
  | "auth"
  | "payments"
  | "rbac"
  | "fileStorage"
  | "bookings"
  | "orderTracking"
  | "cms";

export type TraceStep = {
  from: string;
  because: string;
  produced: string[];
};

export type AssessmentResult = {
  assessment: TechnicalAssessment;
  trace: TraceStep[];
  conclusion: string;
};

export function assessRequirements(answers: Answers): AssessmentResult {
  const has = (code: string) =>
    answers.outcomes.includes(code as never) ||
    answers.operations.includes(code as never) ||
    answers.channels.includes(code as never);

  const trace: TraceStep[] = [];
  const derived = new Set<RequirementCode>();

  if (has("accounts")) {
    derived.add("auth");
    derived.add("database");
    trace.push({
      from: "Visitors can create an account",
      because: "registration, login and password recovery must be persisted",
      produced: ["Authentication", "Database"],
    });
  }

  if (has("payments")) {
    derived.add("payments");
    derived.add("database");
    trace.push({
      from: "Visitors can pay online",
      because: "a payment gateway must verify transactions against orders",
      produced: ["Payment integration", "Database"],
    });
  }

  if (has("bookings")) {
    derived.add("bookings");
    derived.add("database");
    trace.push({
      from: "Visitors book appointments",
      because: "slot availability and reservations need storage and rules",
      produced: ["Booking engine", "Database"],
    });
  }

  if (has("orderTracking")) {
    derived.add("orderTracking");
    derived.add("database");
    derived.add("auth");
    trace.push({
      from: "Visitors track their own orders",
      because: "private records must be fetched per signed-in customer",
      produced: ["Dashboard", "Database", "Authentication"],
    });
  }

  if (has("fileUploads")) {
    derived.add("fileStorage");
    derived.add("backend");
    trace.push({
      from: "Visitors upload documents",
      because: "files need server-side storage, validation and access rules",
      produced: ["File storage", "Backend"],
    });
  }

  if (has("contactForm")) {
    trace.push({
      from: "Visitors send messages",
      because: "a hosted endpoint validates and forwards the message — no application server required",
      produced: ["Form handling (included)"],
    });
  }

  if (has("staffConsole")) {
    derived.add("backend");
    derived.add("database");
    trace.push({
      from: "Staff manage customers in a console",
      because: "an internal interface reads and writes customer records",
      produced: ["Dashboard", "Database"],
    });
  }

  if (has("contentTeam")) {
    derived.add("cms");
    derived.add("backend");
    trace.push({
      from: "Staff publish content themselves",
      because: "an authenticated content editor must sit behind the site",
      produced: ["Content management", "Backend"],
    });
  }

  if (has("staffRoles")) {
    derived.add("rbac");
    derived.add("auth");
    derived.add("database");
    trace.push({
      from: "Different staff see different things",
      because: "roles and permissions have to be enforced server-side",
      produced: ["Role-based access control", "Authentication"],
    });
  }

  if (answers.category === "ecommerce") {
    derived.add("database");
    derived.add("payments");
    trace.push({
      from: "Shop that sells online",
      because: "a catalogue, stock and orders are stored data",
      produced: ["Database", "Payment integration"],
    });
  }

  if (answers.operations.length > 0 || answers.outcomes.length > 3) {
    derived.add("backend");
  }

  const databaseRequired = derived.has("database");
  const authenticationRequired = derived.has("auth");
  const backendRequired =
    derived.has("backend") || databaseRequired || authenticationRequired;

  const thirdPartyServices: string[] = [];
  if (derived.has("payments")) thirdPartyServices.push("Payment gateway");
  if (has("whatsapp") || has("whatsappApi")) thirdPartyServices.push("WhatsApp");
  if (has("whatsappApi")) thirdPartyServices.push("Transactional messaging");
  if (has("newsletter")) thirdPartyServices.push("Email delivery");
  if (derived.has("fileStorage")) thirdPartyServices.push("Object storage");

  const assessment: TechnicalAssessment = {
    backendRequired,
    databaseRequired,
    authenticationRequired,
    paymentIntegrationRequired: derived.has("payments"),
    roleBasedAccessRequired: derived.has("rbac"),
    fileStorageRequired: derived.has("fileStorage"),
    bookingEngineRequired: derived.has("bookings"),
    cmsRequired: derived.has("cms"),
    thirdPartyServices: Array.from(new Set(thirdPartyServices)),
    derived: Array.from(derived),
  };

  const conclusion = backendRequired
    ? "Backend required — this project needs server-side functionality, a database and protected access controls."
    : "Static build — no accounts, records or payments, so the site can be delivered as fast, cacheable pages.";

  return { assessment, trace, conclusion };
}

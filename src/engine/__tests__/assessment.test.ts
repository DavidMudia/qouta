import { describe, expect, it } from "vitest";
import { assessRequirements } from "../assessment";
import { normalise, type Answers } from "../requirements";

const base: Answers = normalise({
  category: "landingPage",
  pages: 3,
  outcomes: ["readInfo"],
  operations: [],
  channels: [],
  timeline: "standard",
});

describe("assessRequirements", () => {
  it("keeps a brochure site static", () => {
    const result = assessRequirements(normalise({
      ...base,
      outcomes: ["readInfo", "contactForm"],
    }));
    expect(result.assessment.backendRequired).toBe(false);
  });

  it("derives authentication and database requirements", () => {
    const result = assessRequirements(normalise({
      ...base,
      outcomes: ["accounts"],
    }));
    expect(result.assessment.authenticationRequired).toBe(true);
    expect(result.assessment.databaseRequired).toBe(true);
  });

  it("derives payment, role, and staff console requirements", () => {
    const result = assessRequirements(normalise({
      ...base,
      category: "ecommerce",
      outcomes: ["payments", "orderTracking"],
      operations: ["staffConsole", "staffRoles"],
    }));
    expect(result.assessment.paymentIntegrationRequired).toBe(true);
    expect(result.assessment.roleBasedAccessRequired).toBe(true);
    expect(result.assessment.backendRequired).toBe(true);
  });

  it("adds ecommerce's payment and database requirements automatically", () => {
    const result = assessRequirements(normalise({
      ...base,
      category: "ecommerce",
    }));
    expect(result.assessment.databaseRequired).toBe(true);
    expect(result.assessment.paymentIntegrationRequired).toBe(true);
  });
});

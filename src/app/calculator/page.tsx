import type { PricingSnapshot } from "@/engine/pricing";
import { Calculator } from "@/components/calculator/Calculator";

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const { getPublishedSnapshot } = await import("@/services/pricingService");
  const snapshot: PricingSnapshot = await getPublishedSnapshot();
  return <Calculator snapshot={snapshot} />;
}

import { desc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { pricingCategories, pricingFeatures, pricingVersions } from "@/db/schema";
import { DEFAULT_SNAPSHOT } from "@/engine/defaultPricing";
import type { PricingSnapshot } from "@/engine/pricing";

/* One seeding task per process, no recursion. */
type Globals = { mwqSeed?: Promise<void> };
const g = globalThis as Globals;

async function seed(): Promise<void> {
  const features = await db.select({ id: pricingFeatures.id }).from(pricingFeatures).limit(1);
  if (features.length === 0) {
    await db.insert(pricingCategories).values(
      DEFAULT_SNAPSHOT.categories.map((c) => ({
        code: c.code,
        name: c.name,
        blurb: c.blurb,
        startingPrice: c.startingPrice,
      })),
    );
    await db.insert(pricingFeatures).values(
      DEFAULT_SNAPSHOT.features.map((f) => ({
        code: f.code,
        name: f.name,
        price: f.price,
        billableGroup: f.billableGroup,
        billing: f.billing,
      })),
    );
  }
  const published = await db.select({ v: pricingVersions.version }).from(pricingVersions).limit(1);
  if (published.length === 0) {
    const working = await readWorking();
    await db.insert(pricingVersions).values({
      version: 1,
      snapshot: { ...working, version: 1, publishedAt: new Date().toISOString(), note: "Opening price list" },
      note: "Opening price list",
      publishedBy: "system",
    });
  }
}

export function ensurePricingSeeded(): Promise<void> {
  if (!g.mwqSeed) g.mwqSeed = seed().catch((err) => { g.mwqSeed = undefined; throw err; });
  return g.mwqSeed;
}

async function readWorking(): Promise<PricingSnapshot> {
  const [cats, feats] = await Promise.all([
    db.select().from(pricingCategories).orderBy(pricingCategories.id),
    db.select().from(pricingFeatures).orderBy(pricingFeatures.id),
  ]);
  return {
    ...DEFAULT_SNAPSHOT,
    categories: cats.map((c) => ({
      id: c.id,
      code: c.code as PricingSnapshot["categories"][number]["code"],
      name: c.name,
      blurb: c.blurb,
      startingPrice: c.startingPrice,
    })),
    features: feats.map((f) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      price: f.price,
      billableGroup: f.billableGroup,
      billing: f.billing as "fixed" | "per_unit",
    })),
  };
}

export async function getWorkingSnapshot(): Promise<PricingSnapshot> {
  await ensurePricingSeeded();
  return readWorking();
}

/** Saves a full configuration snapshot and makes it the customer-visible one. */
export async function publishVersion(note: string, by: string): Promise<PricingSnapshot> {
  await ensurePricingSeeded();
  const working = await readWorking();
  const highest = await db.select({ v: max(pricingVersions.version) }).from(pricingVersions);
  const nextVersion = (highest[0]?.v ?? 0) + 1;
  const snapshot: PricingSnapshot = {
    ...working,
    version: nextVersion,
    note,
    publishedAt: new Date().toISOString(),
  };
  await db.insert(pricingVersions).values({
    version: nextVersion,
    snapshot,
    note,
    publishedBy: by,
  });
  return snapshot;
}

/** The authoritative price list. Customers read this; they never write it. */
export async function getPublishedSnapshot(): Promise<PricingSnapshot> {
  await ensurePricingSeeded();
  const rows = await db
    .select()
    .from(pricingVersions)
    .orderBy(desc(pricingVersions.version))
    .limit(1);
  if (rows.length === 0) return DEFAULT_SNAPSHOT;
  return rows[0].snapshot as PricingSnapshot;
}

export async function listVersions() {
  await ensurePricingSeeded();
  return db.select().from(pricingVersions).orderBy(desc(pricingVersions.version)).limit(20);
}

export async function updateCategoryPrice(id: number, startingPrice: number) {
  await db
    .update(pricingCategories)
    .set({ startingPrice })
    .where(eq(pricingCategories.id, id));
}

export async function updateFeaturePrice(id: number, price: number) {
  await db.update(pricingFeatures).set({ price }).where(eq(pricingFeatures.id, id));
}

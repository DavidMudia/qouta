import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Published price configurations. Customers only ever read the newest row.
 * Editing a price never mutates history — it writes a new version.
 */
export const pricingVersions = pgTable("pricing_versions", {
  id: serial("id").primaryKey(),
  version: integer("version").notNull().unique(),
  snapshot: jsonb("snapshot").notNull(),
  note: text("note").notNull().default(""),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  publishedBy: varchar("published_by", { length: 120 }).notNull().default("system"),
});

/** Normalised working copy of the prices (what the admin edits). */
export const pricingCategories = pgTable("pricing_categories", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: text("name").notNull(),
  blurb: text("blurb").notNull().default(""),
  startingPrice: integer("starting_price").notNull(),
  active: boolean("active").notNull().default(true),
});

export const pricingFeatures = pgTable("pricing_features", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  billableGroup: varchar("billable_group", { length: 40 }).notNull(),
  billing: varchar("billing", { length: 20 }).notNull().default("fixed"),
  active: boolean("active").notNull().default(true),
});

export const customerSubmissions = pgTable("customer_submissions", {
  id: serial("id").primaryKey(),
  ref: varchar("ref", { length: 16 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  company: text("company").notNull().default(""),
  categoryCode: varchar("category_code", { length: 40 }).notNull(),
  pages: integer("pages").notNull().default(5),
  answers: jsonb("answers").notNull(),
  assessment: jsonb("assessment").notNull(),
  lineItems: jsonb("line_items").notNull(),
  subtotal: integer("subtotal").notNull(),
  estimateMin: integer("estimate_min").notNull(),
  estimateMax: integer("estimate_max").notNull(),
  /** What the browser claimed — never trusted. */
  claimedSubtotal: integer("claimed_subtotal"),
  /** Recomputed on the server from the published snapshot. */
  pricingVersion: integer("pricing_version").notNull(),
  mismatch: boolean("mismatch").notNull().default(false),
  source: varchar("source", { length: 20 }).notNull().default("web"),
  status: varchar("status", { length: 20 }).notNull().default("new"),
});

export const adminAccounts = pgTable("admin_accounts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull().default("Developer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

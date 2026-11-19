CREATE TABLE "admin_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text DEFAULT 'Developer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customer_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"category_code" varchar(40) NOT NULL,
	"pages" integer DEFAULT 5 NOT NULL,
	"answers" jsonb NOT NULL,
	"assessment" jsonb NOT NULL,
	"line_items" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"estimate_min" integer NOT NULL,
	"estimate_max" integer NOT NULL,
	"claimed_subtotal" integer,
	"pricing_version" integer NOT NULL,
	"mismatch" boolean DEFAULT false NOT NULL,
	"source" varchar(20) DEFAULT 'web' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	CONSTRAINT "customer_submissions_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "pricing_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" text NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"starting_price" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "pricing_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pricing_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"billable_group" varchar(40) NOT NULL,
	"billing" varchar(20) DEFAULT 'fixed' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "pricing_features_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pricing_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by" varchar(120) DEFAULT 'system' NOT NULL,
	CONSTRAINT "pricing_versions_version_unique" UNIQUE("version")
);

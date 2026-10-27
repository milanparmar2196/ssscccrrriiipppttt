CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seed_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_key" text NOT NULL,
	"seed_version" text NOT NULL,
	"status" text NOT NULL,
	"counts" jsonb NOT NULL,
	"conflicts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seed_records" (
	"seed_key" text NOT NULL,
	"record_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"last_imported_hash" text NOT NULL,
	"locally_modified" boolean DEFAULT false NOT NULL,
	"tombstoned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seed_records_seed_key_record_key_pk" PRIMARY KEY("seed_key","record_key")
);
--> statement-breakpoint
CREATE INDEX "seed_records_seed_key_idx" ON "seed_records" USING btree ("seed_key");
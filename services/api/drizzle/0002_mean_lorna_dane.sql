CREATE TABLE "artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"owner_id" text NOT NULL,
	"project_id" text,
	"run_id" text,
	"key" text,
	"version_no" integer DEFAULT 1 NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"status" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"project_id" text,
	"run_id" text,
	"idempotency_key" text,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"estimated_credits" integer DEFAULT 0 NOT NULL,
	"credits_charged" integer DEFAULT 0 NOT NULL,
	"units_total" integer,
	"units_done" integer DEFAULT 0 NOT NULL,
	"progress_pct" integer,
	"result_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" jsonb,
	"error" jsonb,
	"model_used" text,
	"tokens_in" integer,
	"tokens_out" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"record_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"type" text DEFAULT 'personal' NOT NULL,
	"name" text NOT NULL,
	"platform" text DEFAULT 'youtube_long' NOT NULL,
	"lifecycle_status" text DEFAULT 'active' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"brand_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deletion_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"lifecycle_status" text DEFAULT 'active' NOT NULL,
	"stage_map" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stage_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"selected_topic_id" text,
	"snapshots" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"open_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deletion_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"secret_hash" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"channel_id" text,
	"channel_title" text,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tokens_encrypted" text,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"sync_status" text DEFAULT 'idle' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "youtube_connections_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE INDEX "artifacts_scope_idx" ON "artifacts" USING btree ("kind","project_id","run_id");--> statement-breakpoint
CREATE INDEX "artifacts_owner_idx" ON "artifacts" USING btree ("owner_id","kind");--> statement-breakpoint
CREATE INDEX "jobs_user_idx" ON "jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "jobs_idempotency_idx" ON "jobs" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "library_records_kind_idx" ON "library_records" USING btree ("kind","record_key");--> statement-breakpoint
CREATE INDEX "projects_owner_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "runs_project_idx" ON "runs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "runs_owner_idx" ON "runs" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "webhooks_user_idx" ON "webhook_subscriptions" USING btree ("user_id");
/**
 * Platform tables: projects, runs, jobs, and a generic artifact store.
 * Domain artifact shapes live in @scriptwriter/shared DTOs and are
 * stored as JSONB — the specs define the shapes; this layer enforces
 * ownership, versioning (versionNo + isCurrent) and lifecycle.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    type: text("type").notNull().default("personal"), // personal | brand
    name: text("name").notNull(),
    platform: text("platform").notNull().default("youtube_long"),
    lifecycleStatus: text("lifecycle_status").notNull().default("active"),
    isSample: boolean("is_sample").notNull().default(false),
    brandId: text("brand_id"),
    data: jsonb("data").notNull().default({}),
    deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_owner_idx").on(t.ownerId)],
);

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    lifecycleStatus: text("lifecycle_status").notNull().default("active"),
    stageMap: jsonb("stage_map").notNull().default({}),
    stageHistory: jsonb("stage_history").notNull().default([]),
    selectedTopicId: text("selected_topic_id"),
    snapshots: jsonb("snapshots").notNull().default({}), // bible/config/angle/generator profile inputs
    openIssues: jsonb("open_issues").notNull().default([]),
    data: jsonb("data").notNull().default({}),
    deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("runs_project_idx").on(t.projectId), index("runs_owner_idx").on(t.ownerId)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    status: text("status").notNull().default("queued"), // queued|running|done|failed|cancelled
    projectId: text("project_id"),
    runId: text("run_id"),
    idempotencyKey: text("idempotency_key"),
    params: jsonb("params").notNull().default({}),
    estimatedCredits: integer("estimated_credits").notNull().default(0),
    creditsCharged: integer("credits_charged").notNull().default(0),
    unitsTotal: integer("units_total"),
    unitsDone: integer("units_done").notNull().default(0),
    progressPct: integer("progress_pct"),
    resultRefs: jsonb("result_refs").notNull().default([]),
    result: jsonb("result"),
    error: jsonb("error"),
    modelUsed: text("model_used"),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("jobs_user_idx").on(t.userId),
    index("jobs_idempotency_idx").on(t.userId, t.idempotencyKey),
  ],
);

/** Versioned domain artifacts (bible versions, topics, scripts, ...). */
export const artifacts = pgTable(
  "artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    ownerId: text("owner_id").notNull(),
    projectId: text("project_id"),
    runId: text("run_id"),
    key: text("key"), // stable sub-key within kind+scope (e.g. master list key, scene id)
    versionNo: integer("version_no").notNull().default(1),
    isCurrent: boolean("is_current").notNull().default(true),
    status: text("status"),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("artifacts_scope_idx").on(t.kind, t.projectId, t.runId),
    index("artifacts_owner_idx").on(t.ownerId, t.kind),
  ],
);

/**
 * Admin library records (taxonomy edits, questions, templates, format
 * profiles, model providers, source library...). These shadow the
 * seed namespace by (kind, key) — seeds are the boot source, runtime
 * reads prefer these records (the §9 conflict model applied at read).
 */
export const libraryRecords = pgTable(
  "library_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    recordKey: text("record_key").notNull(),
    payload: jsonb("payload").notNull(),
    version: integer("version").notNull().default(1),
    status: text("status").notNull().default("active"), // draft|active|archived
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("library_records_kind_idx").on(t.kind, t.recordKey)],
);

export const youtubeConnections = pgTable("youtube_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  channelId: text("channel_id"),
  channelTitle: text("channel_title"),
  scopes: jsonb("scopes").notNull().default([]),
  /** AES-256-GCM envelope (key from .env); never serialised by any endpoint. */
  tokensEncrypted: text("tokens_encrypted"),
  status: text("status").notNull().default("disconnected"),
  syncStatus: text("sync_status").notNull().default("idle"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookSubscriptions = pgTable(
  "webhook_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    url: text("url").notNull(),
    events: jsonb("events").notNull().default([]),
    secretHash: text("secret_hash").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    failureCount: integer("failure_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("webhooks_user_idx").on(t.userId)],
);

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

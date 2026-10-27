/**
 * Auth & account tables (API §3, A9, A10). Kept in a sibling module to
 * the seed schema; drizzle.config reads both via schema.ts re-export.
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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(), // stored lowercased
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  defaultLanguage: text("default_language"),
  notificationPrefs: jsonb("notification_prefs").notNull().default({}),
  planKey: text("plan_key").notNull().default("personal"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  /** active | suspended | pending_deletion | deletion_failed | deleted */
  status: text("status").notNull().default("active"),
  deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per refresh token; rotation chains rows inside a family. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(), // user id, or admin user id when kind=admin
    kind: text("kind").notNull().default("user"), // user | admin
    familyId: uuid("family_id").notNull(),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedById: uuid("replaced_by_id"),
    actorLabel: text("actor_label"), // e.g. "bootstrap" for bootstrap sessions (A9)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_family_idx").on(t.familyId)],
);

/** Single-use, expiring, hashed at rest (verify 24h / reset 1h). */
export const emailTokens = pgTable(
  "email_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    purpose: text("purpose").notNull(), // verify_email | reset_password
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_tokens_user_idx").on(t.userId, t.purpose)],
);

/** Transactional email outbox: send failure -> queued retry, never silent. */
export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  toEmail: text("to_email").notNull(),
  template: text("template").notNull(), // verify_email | password_reset | admin_message | ...
  payload: jsonb("payload").notNull().default({}),
  status: text("status").notNull().default("queued"), // queued | sent | delayed
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

/** Verification/account events (A10) — token values are never logged. */
export const accountEvents = pgTable("account_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  meta: jsonb("meta").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Login rate limiting with lockout/backoff (A9). */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scopeKey: text("scope_key").notNull(), // e.g. "user:<email>" | "admin:<email>"
    success: boolean("success").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_scope_idx").on(t.scopeKey, t.createdAt)],
);

/** Credit ledger (append-only; anonymised to deleted-user on hard delete). */
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(), // grant | hold | charge | release | restoration | purchase | adjustment
    amount: integer("amount").notNull(), // signed integer credits — no floats
    jobId: text("job_id"),
    note: text("note"),
    actor: text("actor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credit_ledger_user_idx").on(t.userId, t.createdAt)],
);

/** A9: regular admins are DB records with hashed passwords + roles. */
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // admin | super_admin
  status: text("status").notNull().default("active"), // active | disabled
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaSecretRef: text("mfa_secret_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Drizzle schema — data foundation slice.
 *
 * The seed system (API §9 / docs/SEED_DATA.md) stores seeded records in
 * a system namespace: one row per record, keyed by (seedKey, recordKey)
 * where recordKey is the record's stable ID inside its seed file.
 * Domain tables (users, projects, runs, ...) arrive with their feature
 * slices; nothing here pre-empts them.
 */
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** One seeded record in the system namespace. */
export const seedRecords = pgTable(
  "seed_records",
  {
    seedKey: text("seed_key").notNull(),
    recordKey: text("record_key").notNull(),
    payload: jsonb("payload").notNull(),
    /** sha256 of the payload as last imported from the seed file. */
    lastImportedHash: text("last_imported_hash").notNull(),
    /** True once anything local changes the payload away from the import. */
    locallyModified: boolean("locally_modified").notNull().default(false),
    /** Locally deleted records stay deleted across re-imports (§9). */
    tombstoned: boolean("tombstoned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.seedKey, t.recordKey] }),
    index("seed_records_seed_key_idx").on(t.seedKey),
  ],
);

/** One row per import run — the import report (§9). */
export const seedImports = pgTable("seed_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  seedKey: text("seed_key").notNull(),
  seedVersion: text("seed_version").notNull(),
  status: text("status").notNull(), // completed | failed
  counts: jsonb("counts").notNull(), // { added, updated, unchanged, conflicted, skipped }
  conflicts: jsonb("conflicts").notNull().default([]),
  errors: jsonb("errors").notNull().default([]),
  warnings: jsonb("warnings").notNull().default([]),
  actor: text("actor").notNull(), // admin id | "bootstrap" | "cli"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** §9: every admin mutation writes an audit row in the same transaction. */
export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

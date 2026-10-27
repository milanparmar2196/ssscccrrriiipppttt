import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { seedImports, seedRecords } from "../db/schema.js";
import type { ImportReport, SeedStore, StoredSeedRecord } from "./types.js";

/** Production SeedStore over Postgres (seed_records / seed_imports). */
export class DrizzleSeedStore implements SeedStore {
  async getRecord(seedKey: string, recordKey: string): Promise<StoredSeedRecord | undefined> {
    const db = getDb();
    const rows = await db
      .select()
      .from(seedRecords)
      .where(and(eq(seedRecords.seedKey, seedKey), eq(seedRecords.recordKey, recordKey)))
      .limit(1);
    const row = rows[0];
    if (!row) return undefined;
    return {
      payload: row.payload as Record<string, unknown>,
      lastImportedHash: row.lastImportedHash,
      locallyModified: row.locallyModified,
      tombstoned: row.tombstoned,
    };
  }

  async putRecord(
    seedKey: string,
    recordKey: string,
    payload: Record<string, unknown>,
    lastImportedHash: string,
  ): Promise<void> {
    const db = getDb();
    await db
      .insert(seedRecords)
      .values({ seedKey, recordKey, payload, lastImportedHash })
      .onConflictDoUpdate({
        target: [seedRecords.seedKey, seedRecords.recordKey],
        set: { payload, lastImportedHash, locallyModified: false, updatedAt: new Date() },
      });
  }

  async saveImport(report: ImportReport, actor: string): Promise<string> {
    const db = getDb();
    const rows = await db
      .insert(seedImports)
      .values({
        seedKey: report.seedKey,
        seedVersion: report.seedVersion,
        status: report.status,
        counts: report.counts,
        conflicts: report.conflicts,
        errors: report.errors,
        warnings: report.warnings,
        actor,
      })
      .returning({ id: seedImports.id });
    return rows[0]!.id;
  }

  async listImports(seedKey?: string) {
    const db = getDb();
    const rows = await db
      .select()
      .from(seedImports)
      .where(seedKey ? eq(seedImports.seedKey, seedKey) : undefined)
      .orderBy(desc(seedImports.createdAt));
    return rows.map((r) => ({
      id: r.id,
      actor: r.actor,
      report: {
        seedKey: r.seedKey,
        seedVersion: r.seedVersion,
        status: r.status as ImportReport["status"],
        counts: r.counts as ImportReport["counts"],
        conflicts: r.conflicts as ImportReport["conflicts"],
        errors: r.errors as string[],
        warnings: (r.warnings as string[] | null) ?? [],
      },
    }));
  }

  async listSeedKeys() {
    const db = getDb();
    const rows = await db
      .select({ seedKey: seedRecords.seedKey, records: sql<number>`count(*)::int` })
      .from(seedRecords)
      .groupBy(seedRecords.seedKey);
    const result = [];
    for (const r of rows) {
      const imports = await this.listImports(r.seedKey);
      result.push({ seedKey: r.seedKey, records: r.records, lastImport: imports[0]?.report });
    }
    return result;
  }
}

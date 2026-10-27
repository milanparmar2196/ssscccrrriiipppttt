/**
 * The importer (§9): idempotent upsert by stable ID inside the system
 * namespace. Rules (docs/SEED_DATA.md):
 * - new record -> added
 * - seed unchanged since last import -> unchanged (no write)
 * - seed changed, record untouched locally -> updated
 * - record locally modified AND seed changed -> CONFLICT: the local
 *   record wins, the conflict is reported, nothing is overwritten
 * - tombstoned (locally deleted) records stay deleted -> skipped
 * - user-created records are never touched (they live outside this
 *   namespace entirely)
 */
import { contentHash } from "./hash.js";
import type { ImportReport, SeedRecord, SeedStore } from "./types.js";

export async function importSeed(
  store: SeedStore,
  seedKey: string,
  seedVersion: string,
  records: SeedRecord[],
  extractionErrors: string[],
  actor: string,
  extractionWarnings: string[] = [],
): Promise<ImportReport> {
  const counts = { added: 0, updated: 0, unchanged: 0, conflicted: 0, skipped: 0 };
  const conflicts: ImportReport["conflicts"] = [];
  const errors = [...extractionErrors];

  for (const record of records) {
    const seedHash = contentHash(record.payload);
    const existing = await store.getRecord(seedKey, record.recordKey);

    if (!existing) {
      await store.putRecord(seedKey, record.recordKey, record.payload, seedHash);
      counts.added++;
      continue;
    }
    if (existing.tombstoned) {
      counts.skipped++;
      conflicts.push({
        recordKey: record.recordKey,
        reason: "locally deleted (tombstoned) — stays deleted",
      });
      continue;
    }
    const localHash = contentHash(existing.payload);
    const seedChanged = seedHash !== existing.lastImportedHash;
    const locallyModified = localHash !== existing.lastImportedHash;

    if (!seedChanged && !locallyModified) {
      counts.unchanged++;
    } else if (seedChanged && locallyModified) {
      counts.conflicted++;
      conflicts.push({
        recordKey: record.recordKey,
        reason: "locally modified and the seed changed — local record kept",
      });
    } else if (seedChanged) {
      await store.putRecord(seedKey, record.recordKey, record.payload, seedHash);
      counts.updated++;
    } else {
      // Only locally modified, seed identical to last import: nothing to do.
      counts.unchanged++;
    }
  }

  const report: ImportReport = {
    seedKey,
    seedVersion,
    status: errors.length > 0 ? "failed" : "completed",
    counts,
    conflicts,
    errors,
    warnings: extractionWarnings,
  };
  report.id = await store.saveImport(report, actor);
  return report;
}

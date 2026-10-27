/**
 * Seed system types (API §9 / docs/SEED_DATA.md).
 * A seed file decomposes into records; each record has a stable key
 * inside its seed file's namespace. Imports upsert by that key.
 */
export interface SeedRecord {
  recordKey: string;
  payload: Record<string, unknown>;
}

export interface StoredSeedRecord {
  payload: Record<string, unknown>;
  lastImportedHash: string;
  locallyModified: boolean;
  tombstoned: boolean;
}

export interface ImportCounts {
  added: number;
  updated: number;
  unchanged: number;
  conflicted: number;
  skipped: number;
}

export interface ImportReport {
  id?: string;
  seedKey: string;
  seedVersion: string;
  status: "completed" | "failed";
  counts: ImportCounts;
  conflicts: Array<{ recordKey: string; reason: string }>;
  errors: string[];
  warnings: string[];
}

/** Storage abstraction — Drizzle in production, in-memory in tests. */
export interface SeedStore {
  getRecord(seedKey: string, recordKey: string): Promise<StoredSeedRecord | undefined>;
  putRecord(
    seedKey: string,
    recordKey: string,
    payload: Record<string, unknown>,
    lastImportedHash: string,
  ): Promise<void>;
  saveImport(report: ImportReport, actor: string): Promise<string>;
  listImports(seedKey?: string): Promise<Array<{ id: string; report: ImportReport; actor: string }>>;
  listSeedKeys(): Promise<Array<{ seedKey: string; records: number; lastImport?: ImportReport }>>;
}

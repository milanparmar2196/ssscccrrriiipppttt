import type { ImportReport, SeedStore, StoredSeedRecord } from "./types.js";

/** In-memory SeedStore — tests and validation dry-runs. */
export class MemorySeedStore implements SeedStore {
  private records = new Map<string, StoredSeedRecord>();
  private imports: Array<{ id: string; report: ImportReport; actor: string }> = [];
  private seq = 0;

  private key(seedKey: string, recordKey: string) {
    return `${seedKey}::${recordKey}`;
  }

  async getRecord(seedKey: string, recordKey: string) {
    return this.records.get(this.key(seedKey, recordKey));
  }

  async putRecord(
    seedKey: string,
    recordKey: string,
    payload: Record<string, unknown>,
    lastImportedHash: string,
  ) {
    this.records.set(this.key(seedKey, recordKey), {
      payload,
      lastImportedHash,
      locallyModified: false,
      tombstoned: false,
    });
  }

  /** Test/admin helpers: simulate a local edit or delete after import. */
  async simulateLocalEdit(seedKey: string, recordKey: string, payload: Record<string, unknown>) {
    const k = this.key(seedKey, recordKey);
    const cur = this.records.get(k);
    if (!cur) throw new Error(`no record ${k}`);
    this.records.set(k, { ...cur, payload, locallyModified: true });
  }

  async simulateLocalDelete(seedKey: string, recordKey: string) {
    const k = this.key(seedKey, recordKey);
    const cur = this.records.get(k);
    if (!cur) throw new Error(`no record ${k}`);
    this.records.set(k, { ...cur, tombstoned: true });
  }

  async saveImport(report: ImportReport, actor: string) {
    const id = `import-${++this.seq}`;
    this.imports.push({ id, report, actor });
    return id;
  }

  async listImports(seedKey?: string) {
    return this.imports.filter((i) => !seedKey || i.report.seedKey === seedKey);
  }

  async listSeedKeys() {
    const byKey = new Map<string, number>();
    for (const k of this.records.keys()) {
      const seedKey = k.split("::")[0]!;
      byKey.set(seedKey, (byKey.get(seedKey) ?? 0) + 1);
    }
    return [...byKey.entries()].map(([seedKey, records]) => ({
      seedKey,
      records,
      lastImport: [...this.imports].reverse().find((i) => i.report.seedKey === seedKey)?.report,
    }));
  }

  recordCount(seedKey: string): number {
    let n = 0;
    for (const k of this.records.keys()) if (k.startsWith(`${seedKey}::`)) n++;
    return n;
  }
}

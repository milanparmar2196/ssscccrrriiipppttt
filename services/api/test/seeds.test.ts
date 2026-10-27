import { describe, expect, it } from "vitest";
import { crossValidate } from "../src/seeds/extractors.js";
import { loadAllSeedFiles, SEED_KEYS } from "../src/seeds/files.js";
import { importSeed } from "../src/seeds/importer.js";
import { MemorySeedStore } from "../src/seeds/memory-store.js";

/**
 * Seed system tests over the REAL seed files (docs/SEED_DATA.md).
 * Counts are the validated numbers from the design programme.
 */
describe("seed extraction", () => {
  it("extracts every seed file with no errors and expected counts", async () => {
    const all = await loadAllSeedFiles();
    const counts: Record<string, number> = {};
    for (const [key, ex] of all) {
      expect(ex.errors, `${key} extraction errors`).toEqual([]);
      counts[key] = ex.records.length;
    }
    expect(counts.taxonomy).toBe(25 + 220 + 417); // categories + niches + sub-niches
    expect(counts.config_questions).toBe(36);
    expect(counts.question_packs).toBe(12);
    expect(counts.visual).toBe(16 + 25 + 25 + 2); // archetypes+mappings+overrides+meta
    expect(counts.registry).toBe(11 + 25 + 31 + 1); // types+assignments+overrides+meta
    expect(counts.format_profiles).toBe(6);
    expect(counts.annex_templates).toBe(6);
    expect(counts.audit_checklists).toBe(35 + 1);
    // 111 glossary entries, all kept: "Disruption" and "Pivot" each appear
    // twice with different definitions and are stored as separate entries
    // distinguished by `sense` (user decision 2026-10-27) — 111 unique
    // records, no duplicate-key warnings.
    expect(counts.finance_glossary).toBe(111);
    expect(all.get("finance_glossary")!.warnings).toHaveLength(0);
    expect(counts.model_providers).toBe(12 + 28 + 15 + 1); // providers+models+stages+embedding
    expect(counts.angles).toBe(17069);
  });

  it("cross-file references all resolve", async () => {
    const all = await loadAllSeedFiles();
    expect(crossValidate(all)).toEqual([]);
  });
});

describe("importer", () => {
  it("imports idempotently: second run adds nothing", async () => {
    const all = await loadAllSeedFiles();
    const store = new MemorySeedStore();
    for (const key of SEED_KEYS) {
      const ex = all.get(key)!;
      const first = await importSeed(store, key, ex.seedVersion, ex.records, ex.errors, "test");
      expect(first.counts.added).toBe(ex.records.length);
      const second = await importSeed(store, key, ex.seedVersion, ex.records, ex.errors, "test");
      expect(second.counts.added).toBe(0);
      expect(second.counts.updated).toBe(0);
      expect(second.counts.unchanged).toBe(ex.records.length);
    }
  });

  it("a locally modified record conflicts instead of being overwritten", async () => {
    const all = await loadAllSeedFiles();
    const store = new MemorySeedStore();
    const ex = all.get("format_profiles")!;
    await importSeed(store, "format_profiles", ex.seedVersion, ex.records, [], "test");
    const target = ex.records[0]!;
    await store.simulateLocalEdit("format_profiles", target.recordKey, {
      ...target.payload,
      label: "Locally renamed",
    });
    const changedSeed = ex.records.map((r) =>
      r.recordKey === target.recordKey ? { ...r, payload: { ...r.payload, label: "Seed v2" } } : r,
    );
    const report = await importSeed(store, "format_profiles", "v2", changedSeed, [], "test");
    expect(report.counts.conflicted).toBe(1);
    const stored = await store.getRecord("format_profiles", target.recordKey);
    expect((stored!.payload as { label: string }).label).toBe("Locally renamed");
  });

  it("a tombstoned record stays deleted on re-import", async () => {
    const all = await loadAllSeedFiles();
    const store = new MemorySeedStore();
    const ex = all.get("format_profiles")!;
    await importSeed(store, "format_profiles", ex.seedVersion, ex.records, [], "test");
    const target = ex.records[0]!;
    await store.simulateLocalDelete("format_profiles", target.recordKey);
    const report = await importSeed(store, "format_profiles", ex.seedVersion, ex.records, [], "test");
    expect(report.counts.skipped).toBe(1);
    expect(report.conflicts[0]?.reason).toContain("tombstoned");
  });
});

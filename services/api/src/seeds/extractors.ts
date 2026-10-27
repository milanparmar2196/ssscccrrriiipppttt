/**
 * Per-seed-file record extraction. Each extractor turns one parsed
 * seed JSON into stable-keyed records; malformed entries become
 * validation errors (the record is skipped, never guessed over —
 * docs/SEED_DATA.md).
 */
import type { SeedRecord } from "./types.js";

export interface Extraction {
  seedVersion: string;
  records: SeedRecord[];
  errors: string[];
  warnings: string[];
}

/** Attach warnings + enforce per-file recordKey uniqueness (first wins). */
export function finishExtraction(ex: Omit<Extraction, "warnings">, seedKey: string): Extraction {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const records: SeedRecord[] = [];
  for (const r of ex.records) {
    if (seen.has(r.recordKey)) {
      warnings.push(
        `${seedKey}: duplicate record key ${r.recordKey} in the seed file — first occurrence kept, duplicate skipped (flagged for editorial review, never merged silently)`,
      );
      continue;
    }
    seen.add(r.recordKey);
    records.push(r);
  }
  return { ...ex, records, warnings };
}

type Obj = Record<string, unknown>;
const arr = (v: unknown): Obj[] => (Array.isArray(v) ? (v as Obj[]) : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function slug(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export const EXTRACTORS: Record<string, (data: Obj) => Omit<Extraction, "warnings">> = {
  taxonomy(data) {
    const records: SeedRecord[] = [];
    const errors: string[] = [];
    const catKeys = new Set(arr(data.categories).map((c) => str(c.key)));
    for (const c of arr(data.categories)) {
      records.push({ recordKey: `category:${str(c.key)}`, payload: c });
    }
    const seenIds = new Set<number>();
    for (const n of arr(data.niches)) {
      const { subNiches, ...niche } = n;
      const id = n.id as number;
      if (seenIds.has(id)) errors.push(`taxonomy: duplicate niche id ${id}`);
      seenIds.add(id);
      if (!catKeys.has(str(n.categoryKey))) {
        errors.push(`taxonomy: niche ${id} references unknown categoryKey ${str(n.categoryKey)}`);
      }
      records.push({ recordKey: `niche:${id}`, payload: niche });
      for (const s of arr(subNiches)) {
        const sid = s.id as number;
        if (seenIds.has(sid)) errors.push(`taxonomy: duplicate sub-niche id ${sid}`);
        seenIds.add(sid);
        records.push({
          recordKey: `sub:${sid}`,
          payload: { ...s, nicheId: id },
        });
      }
    }
    return { seedVersion: str(data.seedVersion), records, errors };
  },

  config_questions(data) {
    const records = arr(data.questions).map((q) => ({
      recordKey: `question:${str(q.key)}`,
      payload: q,
    }));
    return { seedVersion: str(data.version), records, errors: [] };
  },

  question_packs(data) {
    const records = arr(data.packs).map((p) => ({
      recordKey: `pack:${str(p.pack)}`,
      payload: p,
    }));
    return { seedVersion: str(data.version), records, errors: [] };
  },

  visual(data) {
    const records: SeedRecord[] = [];
    for (const a of arr(data.archetypes)) {
      records.push({ recordKey: `archetype:${str(a.id)}`, payload: a });
    }
    for (const m of arr(data.categoryMapping)) {
      records.push({ recordKey: `categoryMapping:${str(m.categoryKey)}`, payload: m });
    }
    for (const o of arr(data.nicheOverrides)) {
      records.push({ recordKey: `nicheOverride:${slug(str(o.niche))}`, payload: o });
    }
    if (data.fieldOwners) {
      records.push({ recordKey: "meta:fieldOwners", payload: data.fieldOwners as Obj });
    }
    if (data.dualMappingReview) {
      records.push({
        recordKey: "meta:dualMappingReview",
        payload: { items: data.dualMappingReview } as unknown as Obj,
      });
    }
    return { seedVersion: str(data.seedVersion), records, errors: [] };
  },

  registry(data) {
    const records: SeedRecord[] = [];
    for (const t of arr(data.registryTypes)) {
      records.push({ recordKey: `type:${str(t.key)}`, payload: t });
    }
    for (const a of arr(data.categoryAssignments)) {
      records.push({ recordKey: `assignment:${str(a.categoryKey)}`, payload: a });
    }
    for (const o of arr(data.nicheOverrides)) {
      records.push({ recordKey: `override:${String(o.nicheId)}`, payload: o });
    }
    records.push({
      recordKey: "meta:universalSet",
      payload: {
        universalSet: data.universalSet,
        conditionalUniversal: data.conditionalUniversal,
      } as unknown as Obj,
    });
    return { seedVersion: str(data.seedVersion), records, errors: [] };
  },

  format_profiles(data) {
    const records = arr(data.profiles).map((p) => ({
      recordKey: `profile:${str(p.key)}`,
      payload: p,
    }));
    return { seedVersion: str(data.seedVersion), records, errors: [] };
  },

  annex_templates(data) {
    const records = arr(data.templates).map((t) => ({
      recordKey: `template:${str(t.key)}`,
      payload: t,
    }));
    return { seedVersion: str(data.seedVersion), records, errors: [] };
  },

  audit_checklists(data) {
    const records: SeedRecord[] = [];
    for (const c of arr(data.universalChecks)) {
      records.push({ recordKey: `check:${str(c.key)}`, payload: c });
    }
    for (const a of arr(data.nicheAddOns)) {
      records.push({ recordKey: `addon:${str(a.niche)}`, payload: a });
    }
    return { seedVersion: str(data.seedVersion), records, errors: [] };
  },

  finance_glossary(data) {
    // User decision 2026-10-27: duplicate terms with different definitions
    // ("Disruption", "Pivot") are kept as SEPARATE entries, distinguished by
    // their `sense` qualifier, which becomes part of the stable record key.
    const records = arr(data.terms).map((t) => ({
      recordKey: `term:${slug(str(t.term))}${t.sense ? `:${slug(str(t.sense))}` : ""}`,
      payload: t,
    }));
    return { seedVersion: str(data.seedVersion), records, errors: [] };
  },

  model_providers(data) {
    const records: SeedRecord[] = [];
    const providerKeys = new Set<string>();
    const modelIds = new Set<string>();
    for (const p of arr(data.providers)) {
      const { models, ...provider } = p;
      providerKeys.add(str(p.key));
      records.push({ recordKey: `provider:${str(p.key)}`, payload: provider });
      for (const m of arr(models)) {
        modelIds.add(`${str(p.key)}/${str(m.modelId)}`);
        records.push({
          recordKey: `model:${str(p.key)}/${str(m.modelId)}`,
          payload: { ...m, providerKey: p.key },
        });
      }
    }
    const errors: string[] = [];
    for (const a of arr(data.stageAssignments)) {
      records.push({ recordKey: `assignment:${str(a.stage)}`, payload: a });
      if (!providerKeys.has(str(a.providerKey))) {
        errors.push(`models: assignment ${str(a.stage)} references unknown provider ${str(a.providerKey)}`);
      }
      if (!modelIds.has(`${str(a.providerKey)}/${str(a.modelId)}`)) {
        errors.push(`models: assignment ${str(a.stage)} references unknown model ${str(a.modelId)}`);
      }
    }
    if (data.embeddingAssignment) {
      records.push({
        recordKey: "assignment:embedding",
        payload: data.embeddingAssignment as Obj,
      });
    }
    return { seedVersion: str(data.seedVersion), records, errors };
  },

  angles(data) {
    const records = arr(data.angles).map((a) => ({
      recordKey: `angle:${String(a.targetId)}/${str(a.slug)}`,
      payload: a,
    }));
    return { seedVersion: str(data.seedVersion), records, errors: [] };
  },
};

/** Cross-file validation: references that span seed files. */
export function crossValidate(all: Map<string, Extraction>): string[] {
  const errors: string[] = [];
  const taxonomy = all.get("taxonomy");
  const taxonomyIds = new Set<string>();
  const catKeys = new Set<string>();
  if (taxonomy) {
    for (const r of taxonomy.records) {
      if (r.recordKey.startsWith("niche:")) taxonomyIds.add(r.recordKey.slice(6));
      if (r.recordKey.startsWith("sub:")) taxonomyIds.add(r.recordKey.slice(4));
      if (r.recordKey.startsWith("category:")) catKeys.add(r.recordKey.slice(9));
    }
  }
  const registry = all.get("registry");
  const registryTypes = new Set(
    registry?.records
      .filter((r) => r.recordKey.startsWith("type:"))
      .map((r) => r.recordKey.slice(5)) ?? [],
  );
  if (registry) {
    for (const r of registry.records) {
      if (!r.recordKey.startsWith("override:")) continue;
      const nicheId = r.recordKey.slice(9);
      if (taxonomyIds.size && !taxonomyIds.has(nicheId)) {
        errors.push(`registry: override references unknown taxonomy id ${nicheId}`);
      }
      const p = r.payload as { primary?: string; secondary?: string[] };
      if (p.primary && registryTypes.size && !registryTypes.has(p.primary)) {
        errors.push(`registry: override ${nicheId} uses unknown registry type ${p.primary}`);
      }
      for (const s of p.secondary ?? []) {
        if (registryTypes.size && !registryTypes.has(s)) {
          errors.push(`registry: override ${nicheId} uses unknown registry type ${s}`);
        }
      }
    }
  }
  const angles = all.get("angles");
  if (angles && taxonomyIds.size) {
    for (const r of angles.records) {
      const targetId = String((r.payload as Obj).targetId);
      if (!taxonomyIds.has(targetId)) {
        errors.push(`angles: record ${r.recordKey} references unknown taxonomy id ${targetId}`);
        if (errors.length > 25) return errors;
      }
    }
  }
  const packs = all.get("question_packs");
  if (packs && catKeys.size) {
    for (const r of packs.records) {
      const keys = (r.payload as Obj).appliesToCategoryKeys;
      if (Array.isArray(keys)) {
        for (const k of keys) {
          if (!catKeys.has(String(k))) {
            errors.push(`question_packs: ${r.recordKey} applies to unknown categoryKey ${String(k)}`);
          }
        }
      }
    }
  }
  return errors;
}

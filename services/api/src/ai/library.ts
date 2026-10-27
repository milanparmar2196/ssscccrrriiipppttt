/**
 * Runtime library reader: canonical seed data (docs/SEED_DATA.md)
 * shadowed by Admin library_records (the §9 model applied at read —
 * an Admin edit wins over the seed, seeds are never mutated at runtime).
 */
import { loadAllSeedFiles } from "../seeds/files.js";
import type { Extraction } from "../seeds/extractors.js";
import type { PlatformStore } from "../platform/store.js";

let cache: Map<string, Extraction> | undefined;

export async function seedData(): Promise<Map<string, Extraction>> {
  if (!cache) cache = await loadAllSeedFiles();
  return cache;
}

export function resetSeedCache(): void {
  cache = undefined;
}

type Obj = Record<string, unknown>;

async function merged(
  platform: PlatformStore,
  seedKey: string,
  prefix: string,
  libraryKind: string,
): Promise<Obj[]> {
  const all = await seedData();
  const ex = all.get(seedKey);
  const byKey = new Map<string, Obj>();
  for (const r of ex?.records ?? []) {
    if (r.recordKey.startsWith(prefix)) byKey.set(r.recordKey, r.payload as Obj);
  }
  for (const rec of await platform.listLibraryRecords(libraryKind)) {
    if (rec.status === "archived") byKey.delete(`${prefix}${rec.recordKey}`);
    else byKey.set(`${prefix}${rec.recordKey}`, rec.payload);
  }
  return [...byKey.values()];
}

export async function getTaxonomy(platform: PlatformStore) {
  const all = await seedData();
  const ex = all.get("taxonomy")!;
  const categories = ex.records.filter((r) => r.recordKey.startsWith("category:")).map((r) => r.payload as Obj);
  const niches = ex.records.filter((r) => r.recordKey.startsWith("niche:")).map((r) => r.payload as Obj);
  const subs = ex.records.filter((r) => r.recordKey.startsWith("sub:")).map((r) => r.payload as Obj);
  // Admin taxonomy edits/additions (library kind "taxonomy"). Record
  // keys may be prefixed (niche:123) or bare ids (123) depending on
  // which Admin route wrote them — both merge by payload id.
  for (const rec of await platform.listLibraryRecords("taxonomy")) {
    const payloadId = String(rec.payload.id ?? rec.recordKey.split(":").pop());
    const list = rec.recordKey.startsWith("sub:") || rec.payload.parentId !== undefined
      ? subs
      : rec.recordKey.startsWith("category:") ||
          (rec.payload.categoryKey === undefined && rec.payload.parentId === undefined && rec.recordKey.startsWith("category"))
        ? categories
        : rec.recordKey.startsWith("niche:") || rec.payload.categoryKey !== undefined
          ? niches
          : categories;
    const idx = list.findIndex((x) => String(x.id) === payloadId);
    if (rec.status === "archived") {
      if (idx >= 0) list.splice(idx, 1);
    } else if (idx >= 0) list[idx] = rec.payload;
    else list.push(rec.payload);
  }
  return { categories, niches, subs };
}

export async function getConfigQuestions(platform: PlatformStore): Promise<Obj[]> {
  const base = await merged(platform, "config_questions", "question:", "config_question");
  const packs = await merged(platform, "question_packs", "pack:", "question_pack");
  const packQuestions: Obj[] = [];
  for (const pack of packs) {
    for (const q of (pack.questions as Obj[] | undefined) ?? []) {
      packQuestions.push({
        ...q,
        scope: "niche",
        packKey: pack.pack,
        appliesToCategoryKeys: pack.appliesToCategoryKeys,
      });
    }
  }
  return [...base, ...packQuestions];
}

export async function getProviders(platform: PlatformStore): Promise<Obj[]> {
  return merged(platform, "model_providers", "provider:", "model_provider");
}

export async function getProviderModels(platform: PlatformStore): Promise<Obj[]> {
  return merged(platform, "model_providers", "model:", "provider_model");
}

export async function getStageAssignments(platform: PlatformStore): Promise<Obj[]> {
  const base = await merged(platform, "model_providers", "assignment:", "model_assignment");
  return base;
}

export async function getFormatProfiles(platform: PlatformStore): Promise<Obj[]> {
  return merged(platform, "format_profiles", "profile:", "format_profile");
}

export async function getAnnexTemplates(platform: PlatformStore): Promise<Obj[]> {
  return merged(platform, "annex_templates", "template:", "annex_template");
}

export async function getAuditChecklist(platform: PlatformStore) {
  const checks = await merged(platform, "audit_checklists", "check:", "audit_check");
  const addons = await merged(platform, "audit_checklists", "addon:", "audit_addon");
  return { checks, addons };
}

export async function getRegistrySeed(platform: PlatformStore) {
  const all = await seedData();
  const ex = all.get("registry")!;
  const types = ex.records.filter((r) => r.recordKey.startsWith("type:")).map((r) => r.payload as Obj);
  const assignments = ex.records
    .filter((r) => r.recordKey.startsWith("assignment:"))
    .map((r) => r.payload as Obj);
  let overrides = ex.records
    .filter((r) => r.recordKey.startsWith("override:"))
    .map((r) => r.payload as Obj);
  for (const rec of await platform.listLibraryRecords("registry_override")) {
    overrides = overrides.filter((o) => String(o.nicheId) !== rec.recordKey);
    if (rec.status !== "archived") overrides.push(rec.payload);
  }
  const meta = ex.records.find((r) => r.recordKey === "meta:universalSet")?.payload as Obj | undefined;
  return { types, assignments, overrides, universalSet: meta?.universalSet ?? [], conditionalUniversal: meta?.conditionalUniversal ?? [] };
}

export async function getAnglesForTarget(platform: PlatformStore, targetId: string): Promise<Obj[]> {
  const all = await seedData();
  const ex = all.get("angles")!;
  const seeded = ex.records
    .filter((r) => String((r.payload as Obj).targetId) === targetId)
    .map((r) => r.payload as Obj);
  const bySlug = new Map(seeded.map((a) => [String(a.slug), a]));
  for (const rec of await platform.listLibraryRecords("angle")) {
    const payload = rec.payload as Obj & { targetId?: unknown; slug?: unknown };
    if (String(payload.targetId) !== targetId) continue;
    if (rec.status === "archived") bySlug.delete(String(payload.slug));
    else bySlug.set(String(payload.slug), payload);
  }
  return [...bySlug.values()];
}

export async function getVisualSeed(platform: PlatformStore) {
  const all = await seedData();
  const ex = all.get("visual")!;
  return {
    archetypes: ex.records.filter((r) => r.recordKey.startsWith("archetype:")).map((r) => r.payload as Obj),
    categoryMapping: ex.records.filter((r) => r.recordKey.startsWith("categoryMapping:")).map((r) => r.payload as Obj),
    nicheOverrides: ex.records.filter((r) => r.recordKey.startsWith("nicheOverride:")).map((r) => r.payload as Obj),
    fieldOwners: ex.records.find((r) => r.recordKey === "meta:fieldOwners")?.payload as Obj | undefined,
  };
}

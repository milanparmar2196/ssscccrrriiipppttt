import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXTRACTORS, finishExtraction, type Extraction } from "./extractors.js";

/**
 * Seed file registry. Files live in the repo (docs/seeds/, plus
 * docs/question_packs_seed.json) — the canonical docs generate them
 * (docs/SEED_DATA.md). SEEDS_DIR overrides the location.
 */
export const SEED_FILES: Record<string, string> = {
  taxonomy: "docs/seeds/taxonomy_seed.json",
  config_questions: "docs/seeds/config_questions_seed.json",
  question_packs: "docs/question_packs_seed.json",
  visual: "docs/seeds/visual_archetypes_seed.json",
  registry: "docs/seeds/registry_seed.json",
  format_profiles: "docs/seeds/format_profiles_seed.json",
  annex_templates: "docs/seeds/annex_templates_seed.json",
  audit_checklists: "docs/seeds/audit_checklists_seed.json",
  finance_glossary: "docs/seeds/finance_glossary_seed.json",
  model_providers: "docs/seeds/model_providers_seed.json",
  angles: "docs/seeds/angles_seed.json",
};

export const SEED_KEYS = Object.keys(SEED_FILES);

function seedsRoot(): string {
  if (process.env.SEEDS_DIR) return process.env.SEEDS_DIR;
  // services/api/src/seeds/files.ts -> repo root is four levels up.
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../..");
}

export async function loadSeedFile(seedKey: string): Promise<Extraction> {
  const rel = SEED_FILES[seedKey];
  if (!rel) throw new Error(`unknown seed key: ${seedKey}`);
  const extractor = EXTRACTORS[seedKey];
  if (!extractor) throw new Error(`no extractor for seed key: ${seedKey}`);
  const raw = await readFile(path.join(seedsRoot(), rel), "utf8");
  const data = JSON.parse(raw) as Record<string, unknown>;
  return finishExtraction(extractor(data), seedKey);
}

export async function loadAllSeedFiles(): Promise<Map<string, Extraction>> {
  const all = new Map<string, Extraction>();
  for (const key of SEED_KEYS) {
    all.set(key, await loadSeedFile(key));
  }
  return all;
}

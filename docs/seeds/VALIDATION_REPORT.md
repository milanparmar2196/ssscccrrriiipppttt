# Seed Validation Report (2026-10-27 — A7)

Generated per docs/SEED_DATA.md. All files parse as valid JSON.
Nothing below was silently fixed or invented: defects in source
docs are flagged for review, exactly as extracted.

## Passed checks

| Check | Result |
|---|---|
| Categories | 25, unique `categoryKey`s: 25 |
| Taxonomy legacy IDs | all 550 present (001–550), none missing |
| Niches / sub-niches extracted | 220 niches (213 with legacy ID, 5 [NEW], 2 unnumbered — flagged), 417 sub-niches |
| Registry types | **11** ✓ (character, place, knowledge, caseEvent, creature, storyWorld, organisation, product, concept, work, propsWardrobe) |
| Registry category assignments | 25/25 keyed by valid categoryKey |
| Visual archetypes | 16, each with exactly the 10 schema fields; category mapping 25/25 keyed |
| Config questions (Layer A/B) | 36 records (A 16 + B 20 field records from 14/18 labels), keys unique |
| Question packs | 12 packs / 29 questions (existing seed, keys + categoryKeys verified in A6) |
| Format profiles | 6 |
| Annex templates | 6 templates / 75 fields, each with sourceRefs |
| Audit checklists | 35 universal checks + Finance add-on pack (5) |
| Finance glossary | 111 entries extracted from the user's Phase 3 file (found — not missing) |
| Model providers | 12 providers, 28 models, 15 stage assignments — **0 dangling references**; embedding assignment resolves; audit stage ≠ drafting stage (independence holds) |
| Cross-file references | all categoryKeys, archetype IDs, registry types and stage→model links resolve |

## Flagged for review (source-doc issues, not seed errors)

**Taxonomy (NICHE_LIST_MERGED.md)**
1. Legacy ID **443 is a niche twice** (§10 "General Knowledge &
   Exams Foundation", §25 "General Knowledge") — a decision is
   needed on which keeps 443.
2. **35 legacy IDs are used for both a niche and its own first
   sub-niche** (e.g. 215 Weather → Extreme Weather [215]) — an
   importer keying sub-niches by legacy ID collides; sub-niches
   likely need their own IDs or composite keys.
3. Two niches have **no legacy ID and no [NEW] marker** ("Martial
   Arts & Traditional Sports" §14, "Fashion & Clothing Design"
   §17) and their cross-references point at differently named
   entries.
4. §7's [496] cross-reference contradicts the doc's own closing
   notes (§21 has no [496]).
5. Merge-log IDs 369 and 048 lack the "(merged)" in-line marker
   the other seven carry; two [NEW] niche names embed descriptor
   text ("— information only", "— belief content, labelled").

**Config questions (CONFIG_QUESTIONS.md)**
6. `depth_level` and `delivery_format` option wording differs
   between the Layer B text and the Expanded Options (v2.2 used);
   the expanded `delivery_format` partly duplicates B13
   `video_format`'s dimension.
7. Layer A/B define **no types, almost no `required` flags, and few
   `mapsTo`** (packs define all three) — types in the seed are
   inferred and marked as such; 11 questions ship without option
   lists because the doc never enumerates them (several are dynamic
   references: taxonomy, Angle Registry, archetype library).
8. `disclaimer_policy` may be a derived/system field rather than a
   question; `monetization` bundles three decisions in one item.

**Registries / visual (REGISTRY_MAP.md, VISUAL_STYLE_SYSTEM.md)**
9. **Props & Wardrobe has two different schemas** (Part A §11 vs
   the 39-file Addendum: kind/type, periodOrEra/era, stateTable vs
   continuityNotes). Seed uses Part A (canonical per A3); the
   Addendum variant needs reconciling.
10. Verified Data schema in the Addendum lacks the `methodologyNote`
    that PHASE2_ADDITIONS G7 / API require.
11. Addendum-2 Character enrichment field names are prose-derived
    normalisations (variants, designStatus, negativePrompt…, etc.)
    — semantics documented, names to be ratified.
12. Knowledge registry = one type with four variant field sets
    (union seeded; validators must not require all fields per entry).
13. Part C per-niche registry overrides (~25) are **not yet in the
    seed** (outside the extracted shape) — follow-up seed needed
    before an importer can apply them.
14. Visual: intro's "14 schema fields" contradicts the 10-field
    schema (seeded 10); `geography_places_maps` has a dual
    archetype (A1 maps / A10 places) held in notes; two category
    mappings are conditional (film, facts).

**Annexes / audit / profiles**
15. **Data Visualization annex has no formal field schema** — only
    prose rule topics (listed as fields, flagged in the seed).
16. Finance audit add-ons: only 5 items are named in the canonical
    docs ("~10" claimed in the review doc) — the rest were not
    invented.
17. Glossary: "Disruption" and "Pivot" appear twice with slightly
    different definitions (111 entries / 109 unique terms) — kept
    verbatim. **RESOLVED 2026-10-27 (user decision): both definitions
    of each term are kept as SEPARATE entries, distinguished by a
    `sense` qualifier that forms part of the record key (glossary
    seed v1.1) — 111 unique records, no importer warnings.**
18. Format profile keys are derived slugs (the doc gives names
    only); the generic video profile's clip cap is "configurable"
    (null).

**Model catalogue (starter_unverified — by design)**
19. **baseUrl is null for all providers** (docs say "prefilled" but
    state no URLs); `contextWindow` null for all models; several
    env-key names are convention-inferred (Google, Zhipu, Alibaba
    uncertain; Meta/Xiaomi/custom null by design).
20. Several exact model IDs are the least certain items (Kimi,
    Grok-fast, GLM, Qwen embedding, MiniMax embedding, Llama
    hosted IDs, Xiaomi MiMo) — all models carry
    `starter_unverified` and the readiness rule applies: nothing is
    usable until provider enabled + key in .env + Test connection
    passed + Admin activation (docs/SEED_DATA.md).

## Doc ↔ seed differences
None beyond the flags above: every seed value traces to its
canonical doc; where docs conflicted, the seed followed the
documented precedence (v2.2 options, Part A schemas, canonical
category names/keys) and flagged the conflict here.


**Update 2026-10-27 (D4):** the DataViz annex flag above is resolved — the formal dataVizSpec schema + seed chart vocabulary v1 now exist (docs/SCENE_BREAKDOWN.md; annex_templates_seed.json).


**Update 2026-10-27 (clean split, user decision):** the legacy-ID flags above (443 duplicate; 35 parent/sub-niche sharings) are resolved at the ID level — unique `id` on all 637 records, `legacyId` preserved as metadata, 87 fresh IDs (551–637) allocated and documented in TAXONOMY_ID_MAPPING.md (443: 'General Knowledge & Exams Foundation' keeps 443; 'General Knowledge' gets 551, verified unused beforehand). All 35 sharings reviewed: every one is a distinct sub-niche (no parent references, no merges). Uniqueness + referential integrity re-validated (637/637 unique; all 550 legacy numbers present). **Taxonomy seed sign-off was APPROVED and CLOSED by the user on 2026-10-27.**


**Update 2026-10-27 (Part C extraction, user decision):** registry_seed.json `nicheOverrides` now carries **31 records** extracted from docs/REGISTRY_MAP.md Part C, each with a `sourceRef` tracing it to its Part C bullet; validation passed (all nicheIds resolve to taxonomy records — incl. the NEW niches by their fresh ids 554/555 and the Martial Arts History sub-niche at 253; all types are valid RegistryTypes; primary never in secondary; every record sets at least one field). Extraction conventions, recorded not hidden: (1) Part C "co-primary" pairs are stored as primary + secondary with the co-primary fact preserved in the note, because the A8 override shape has a single primary; (2) sub-scoped bullets (Inventions [089], Recipes [091], Sacred Texts [268]) attach to the parent niche with the scope stated in the note — the [089] scope was the one genuinely ambiguous reading — **RESOLVED 2026-10-27 (user decision): the Product-primary override now targets the 'Inventions & Inventors' sub-niche (id 563) only; niche 089 keeps its category default (registry seed v1.1)**; (3) two Part C items are NOT override records: the What If [167] / Then vs Now [165] borrow rule (a resolution behaviour — implement in the resolver, not the seed) and the generic clauses naming athlete/entrepreneur/celebrity biographies and "luxury goods", which match no enumerable taxonomy niches beyond [146] and the Supercars sub [419] already covered.

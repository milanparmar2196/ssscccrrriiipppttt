# Seed Data System (A7 design, 2026-10-27)

Resolves DESIGN_AUDIT A7. All platform configuration that a fresh
installation needs ships as **versioned seed JSON files** in
`docs/seeds/`, generated **from the canonical docs** — never written
by hand independently of them. If a seed value and its canonical doc
disagree, the doc wins and the seed is regenerated.

## Canonical sources → seed files

| Seed file | Canonical source doc |
|---|---|
| `taxonomy_seed.json` | docs/NICHE_LIST_MERGED.md (names canonical per A6; categories referenced by `categoryKey`) |
| `config_questions_seed.json` | docs/CONFIG_QUESTIONS.md (Layer A + Layer B) |
| `question_packs_seed.json` | docs/CONFIG_QUESTIONS.md (niche packs) — lives in docs/, predates this folder |
| `visual_archetypes_seed.json` | docs/VISUAL_STYLE_SYSTEM.md |
| `registry_seed.json` | docs/REGISTRY_MAP.md (11 registry types per A3) |
| `format_profiles_seed.json` | docs/OUTPUT_FORMAT_PROFILES.md |
| `annex_templates_seed.json` | Bible mapping/additions docs (per-template `sourceRefs`) |
| `audit_checklists_seed.json` | API Step 12 + docs/PHASE5_AUDIT_REVIEW.md + docs/SCENE_BREAKDOWN.md |
| `finance_glossary_seed.json` | User's Phase 3 glossary (Knowledge/Concept seed for the Finance niche) |
| `model_providers_seed.json` | docs/MODEL_PROVIDERS.md |

Generation is a checked extraction: every value traces to its doc;
anything missing, ambiguous or conflicting in a doc is **flagged in
the validation report, never invented** (see VALIDATION_REPORT.md in
the same folder).

**Taxonomy IDs (clean split, 2026-10-27):** every taxonomy record
carries a unique stable `id`; the user's original number survives
as `legacyId` metadata and **may repeat** (legacy 443 names two
niches; 35 sub-niches share their parent's number). Any lookup by
`legacyId` must return **all** matches and flag the ambiguity —
code must never silently choose one; imports and references use
the unique `id`. The full allocation (87 fresh IDs, 551–637) is in
docs/seeds/TAXONOMY_ID_MAPPING.md; taxonomy seed sign-off was
APPROVED and CLOSED by the user on 2026-10-27.

## Import semantics (repeatable, safe)

- Seeds import by **stable ID** (question key, categoryKey,
  archetype ID, profile key, model ID…). Import is an upsert keyed
  on those IDs, inside the **system namespace only**.
- **Nothing user-created is ever touched:** user/admin-created
  records live outside the seed ID namespace.
- **No silent overwrites:** each imported record stores
  `seedVersion` + a content hash. On re-import:
  - record unchanged since import → updated to the new seed version;
  - record **modified locally** (Admin edit) → **conflict**: the
    local version is kept, the incoming change is listed in the
    import report for an Admin to accept or reject per record;
  - record deleted locally → stays deleted (tombstone respected)
    unless the Admin explicitly restores it from the seed.
- Every import produces an **import report** (added / updated /
  conflicted / skipped) stored in Admin (§8/§15), and imports are
  idempotent: re-running the same seed version changes nothing.

## Versions, updates, migrations

- Each seed file carries its own `seedVersion`; versions bump only
  when the canonical doc changes the underlying data.
- A version bump that changes a **shape** (field added/renamed/
  removed) must ship a migration note in this doc's changelog and,
  where records are already in use, a data migration — in-use
  records are archived/converted, never dropped (existing data-
  integrity rules).
- Renames of display names do not bump identity: IDs and keys
  (A6 `categoryKey`, question keys, archetype IDs) are immutable.

## Model catalogue readiness (no assumed usability)

Seeded providers/models are **inert** until all of these hold:
provider enabled in Admin → API key present in the server `.env` →
**Test connection passed** → model status set `active` by an Admin.
Every seeded model starts as `starter_unverified`. Stage assignments
are validated for **compatibility** at save and at run time: the
assigned model must exist, be active, and support what the stage
needs (e.g. research/audit stages require structured output; the
embedding assignment requires a `modelType: embedding` model with
multilingual support incl. Hindi). Generation with an unready
assignment fails with a clear **configuration error** naming the
missing piece — it never silently falls back to an unconfigured
model (fallback chains contain only configured, active models).

## Validation (run on every generation + import)

Automated checks (results in `docs/seeds/VALIDATION_REPORT.md`):
unique IDs/keys across every file; every reference resolves
(categoryKeys, archetype IDs, registry types, pack→category links,
stage→model links); expected counts (25 categories, **11 registry
types**, 16 archetypes, 12 packs, 6 format profiles); schema shape
per file; doc↔seed spot diffs (counts and sampled values). Any
failure blocks the seed version from being marked current.

## Angle seed data — IMPORTED title-only (2026-10-27)

**Superseded the same day:** the deferral above held only until the
user shared the file. The user uploaded `ANGLES_MASTER.md` (550
sections, 17,069 angle titles) and directed a title-only import:
`docs/seeds/angles_seed.json` (angles-v1) + the full audit trail in
`docs/seeds/ANGLES_IMPORT_REPORT.md` (section->taxonomy mappings,
117 name differences, ambiguous-ID resolutions incl. 443 -> niche
id 551, slug conflicts: none, skipped: none). Every angle is
`completeness: title_only` — question/scope/evidence/boundary are
unset and are never generated or assumed; an admin completes them
in the Admin angle editor (AI suggestions, when offered, are
labelled drafts in `suggestedFields` and never auto-applied). Runs
selecting a title-only angle follow the story-question path: the
run's story question is required before Research starts, and the
absence of angle scope is visible in the Research header.
Import key `(targetId, slug)`: re-imports never duplicate and
never overwrite post-import edits.

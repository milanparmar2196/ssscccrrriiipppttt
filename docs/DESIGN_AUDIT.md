# Design Audit — Full In-Depth Check (2026-10-27)

Everything read in full: README, Web/Admin/API/Shared specs, all
design docs, seed JSON. Three parallel reviewers + cross-checks.
Verdict up front: **the design's substance is complete — no pipeline
stage, Bible layer or feature is missing at the concept level.** What
the audit found is (A) a short list of build-blockers where later
additions were never folded back into the base specs, (B) stale text
from superseded decisions, and (C) polish items. Counts: 12 A-items,
~15 B-items, ~8 C-items.

## A. Build-blockers (fix before or at scaffold)

- **A1 Research has no retrieval mechanism.** ✅ **RESOLVED
  2026-10-27** (user's custom design, docs/RESEARCH_SOURCES.md;
  API §6B + Step 7, Admin §8 + `/source-library`, Web Step 7
  detail, Shared DTOs): curated sources first — global Source
  Library (Admin) + project Master Source List, 4 research modes
  with project default + run override, gap prompt (never a silent
  web switch), web-discovered sources labelled + review queue,
  starter bundles + reviewed niche coverage, fetch/link-check
  pipeline, insufficient-evidence paths, stricter health-claim
  rules. Original finding: Step 7 demanded passage-level claims
  from tier-1 sources, but no web-search provider, URL fetcher or
  scraping pipeline was specified anywhere.
- **A2 No embeddings.** ✅ **RESOLVED 2026-10-27** (user's design;
  docs/MODEL_PROVIDERS.md §5; API §6A + Step 4–5 + Step 12; Admin §9;
  Web similarity display; Shared SimilarityMatch/SemanticStatus):
  embedding models inside Model Providers, vectors in the main DB
  (pgvector) stamped with model + version, per-purpose Admin
  thresholds (calibrated on Hindi/English pairs), re-index job on
  model change, scores as indicators with matches + context shown
  and continue-anyway recorded, owner-scoped comparisons, and honest
  unavailable/keyword-only states — originality is never reported
  clear unless the checks actually ran. Original finding: topic
  dedupe (409), Do-Not-Repeat matching and external Originality all
  needed semantic similarity, but no embedding model/stage, vector
  store, or similarity threshold existed anywhere.
- **A3 Registry count 10 vs 11 — everywhere.** ✅ **RESOLVED
  2026-10-27** (user confirmed: 11 everywhere, Props & Wardrobe is a
  full registry type): REGISTRY_MAP Part A retitled "The 11 Registry
  Types" with Type 11 (Props & Wardrobe) now defined in Part A
  itself, API §5 states 11 types + module CRUD covering all 11,
  Shared names 11 entry DTOs incl. PropsWardrobeEntry, Admin §8
  Registry Type Library lists all 11. Verified by sweep — no "10
  types" references remain outside the historical Notion backup.
  Original finding: REGISTRY_MAP Part A, Admin §8 and Shared ("the
  10 registry entry DTOs") omitted/denied propsWardrobe; API §5 said
  "10 types" then listed 11.
- **A4 Audit maths impossible.** ✅ **RESOLVED 2026-10-27** (user's
  model, written into API Step 12 as canonical + Admin §7 + Web §9 +
  Shared): weighted total — total = Σ (areaScore ÷ 10 × weight),
  applicable weights sum to 100; default weight sets for standard
  (11 areas) and Brand (12, brandCompliance 10, rebalanced);
  versioned AuditWeightConfig validated on save (≥ 0, applicable
  areas > 0, sums to exactly 100) and snapshotted per audit; N/A
  areas excluded with weight redistributed proportionally and both
  weights shown; a required area that cannot be assessed makes the
  audit **incomplete** (never zero, never silently excluded);
  critical checks block passing regardless of total
  (`blockedByCritical`); Editorial Depth is settled as the separate
  per-deliverable verdict layer, not a scored area, and a "Needs
  work" verdict blocks Final Approval. Original finding: 11 areas ×
  /10 ≠ /100 (12 for Brand = 120), no weighting defined, Editorial
  Depth ambiguous between dimension/verdict/absent.
- **A5 Source `tier` collision.** ✅ **RESOLVED 2026-10-27**
  (user's model; checked against A1 — no rule conflicts: A1's
  `awaiting_review` status becomes reviewStatus `pending`, its
  `listStatus` becomes the global-scope reviewStatus, and A1's
  run-use rule is preserved verbatim). Everywhere now:
  `credibilityTier: 1–5|null` (tier 5 = do-not-use, blocked in every
  scope), `reviewStatus: approved|pending|blocked` decided **per
  scope** (global → project → run; a broader block always wins, a
  narrower scope may be stricter, never looser), and `availability`
  as the purely operational field. Origin, tier and review status
  are displayed separately in brief/bibliography/Admin; the
  bibliography groups by credibility tier with web-discovered
  sources listed apart. Migration is guess-free: legacy
  `tier: approved|blocked` values migrate to reviewStatus, the
  credibilityTier stays null and is flagged `needs_tier_review`.
  Written into docs/RESEARCH_SOURCES.md (A5 section), API §5/§6B/
  Step 7/Step 14, Admin §8, Web Step 7, Shared Source DTO. Original
  finding: Master Source List entries used `tier: approved|blocked`
  while run Sources used `tier: 1–5`, and the Package bibliography
  grouped by "Master Source List tiers" that didn't exist.
- **A6 Category-name drift.** ✅ **RESOLVED 2026-10-27** (user:
  merged list canonical + stable keys): NICHE_LIST_MERGED now
  carries a Category Keys table (25 stable `categoryKey`s); the 5
  drifted names in REGISTRY_MAP and VISUAL_STYLE_SYSTEM were
  corrected to canonical and every mapping row in both docs is
  annotated with its key; question_packs_seed.json gained
  `appliesToCategoryKeys` per pack; Admin §8 records the rule
  (names editable, keys immutable, mappings reference keys).
  Verified programmatically: all 25 rows in both mapping docs match
  canonical name + key, all 12 packs keyed, no drifted strings
  remain. Original finding: 5 category names differed between
  NICHE_LIST_MERGED and REGISTRY_MAP/VISUAL_STYLE_SYSTEM/seed JSON,
  so string-keyed assignments would silently miss.
- **A7 Seed data is prose-only (except question packs).** ✅
  **RESOLVED 2026-10-27** (user's design; docs/SEED_DATA.md +
  docs/seeds/): all configuration now exists as versioned seed
  JSONs generated from the canonical docs — taxonomy (25
  categories/220 niches/417 sub-niches, all 550 legacy IDs),
  Layer A/B questions (36 records), question packs, 16 archetypes
  + mappings, registry schemas + assignments (11 types), 6 format
  profiles, 6 annex templates (75 fields), audit checklists (35
  universal + Finance pack), finance glossary (111 terms, found in
  the user's Phase 3 file), and a starter model catalogue (12
  providers / 28 models / 15 stage assignments, 0 dangling refs).
  Import semantics are safe and repeatable (stable-ID upsert,
  conflicts never silently overwritten, tombstones respected,
  import reports); seeds are versioned with migration rules;
  models are `starter_unverified` and inert until the readiness
  checks pass, with stage-compatibility validation. Full results +
  20 flagged source-doc issues (taxonomy [443] duplicate, 35
  parent/sub ID collisions, Props schema conflict, missing model
  base URLs/context windows, etc.) are in
  docs/seeds/VALIDATION_REPORT.md — flagged, not invented.
  Original finding: no importable seed existed for Layer A/B
  questions, the taxonomy, archetypes, registries, profiles,
  annexes, checklists or glossary, and the model catalogue named
  zero concrete models with no default stage assignments.
- **A8 Niche Template "Registries" section has no shape.** ✅
  **RESOLVED 2026-10-27** (user's design): templates now have 10
  sections everywhere (Shared §1A sections object gains
  `registries?: TemplateRegistriesSection | null`; API §6A "Full
  template: 10 sections"). Shape: `null` = inherit, or
  `{ mode: "explicit", primary, secondary[] }` with `secondary: []`
  as an intentional empty selection, distinct from inheritance.
  Resolution order: template explicit → per-niche override
  (`NicheRegistryOverride`, Part C) → category map by categoryKey.
  Clearing = back to `null` / deleting the override record.
  Validation on save (valid 11 types incl. propsWardrobe, primary ∉
  secondary, no duplicates, overrides reference real niches and set
  ≥1 field; ambiguous assignments flagged, never guessed). Existing
  templates resolve by inheritance with nothing rewritten. Web §4A
  preview now lists all 10 sections with the resolved registry set +
  source badge; registry_seed.json carries the `nicheOverrides`
  structure with an honest pending-extraction status (Part C
  entries not guessed, per A7). Original finding: Admin said 10
  sections, API said 9, Shared had 9 keys and no `registries`.
- **A9 Admin identity contradiction.** ✅ **RESOLVED 2026-10-27**
  (user chose the bootstrap model): one bootstrap super-admin
  credential in server `.env` (first setup + controlled recovery,
  rotated by changing .env + restart, sessions invalidated);
  regular admins are DB `AdminUser` records with hashed passwords
  and assigned roles, enforced server-side on every action, with
  per-admin `AdminAuditLog` attribution — bootstrap use is logged
  under the distinct actor `bootstrap`. Login is rate-limited with
  lockout/backoff; sessions are short-lived. MFA stays not-required
  for this deployment, but the model is MFA-ready (reserved
  second-factor step + nullable MFA fields, no future migration).
  Credentials never appear in UI/logs/seeds/API responses.
  Migration from a single-admin (.env-only) install is defined:
  boot once with the bootstrap credential, create the first
  AdminUser, continue — no access or data lost. Written into Admin
  §2/§15, API §3, Shared AdminUser DTO, README deployment rules;
  the Q4 note now reads as the bootstrap credential, and provider
  API keys remain .env-only as before. Original finding: one shared
  .env credential vs AdminUser table, role claims and per-admin
  audit log could not all be true.
- **A10 Adopted features missing endpoints/tables.** ✅
  **RESOLVED 2026-10-27** (full pass; per-feature record in
  docs/A10_CHECKLIST.md with dependencies, migrations and
  acceptance tests). The one item initially left open — email
  verification gating — was decided by the user the same day:
  verification gates cost-incurring jobs server-side
  (`403 EMAIL_NOT_VERIFIED` before any credit hold), everything
  else stays open; API §3 + §11 and Web §3 carry the rules and
  acceptance criteria. Everything is now written consistently across API/Admin/
  Web/Shared/README: Angle CRUD + run snapshot rule, all missing
  tables (incl. AuditWeightConfig from A4), archetype serving
  endpoints, ShotRecipe delete/archive, Completion Certificate
  endpoint + immutability, Corrections Log (append-only), proposed
  Bible edits approve/reject (approval → new Bible version),
  account deletion (30-day grace, anonymised retention,
  deletion_failed state), project export (owner-only job → signed
  ZIP, no partial-ready), uploads (presigned init/complete,
  SHA-256 verification, verified-only attach), email infrastructure
  (env-configured, queued-retry failure states, anti-enumeration
  resend), YouTube (readonly scopes only, tokens encrypted at rest
  and never serialised, disconnect keeps metrics marked
  last-synced, user-set video matching, quota/reauth states), and
  webhook definitions (secret shown once, HMAC-signed deliveries).
  A9 attribution preserved throughout; Admin §13's stale
  credentials sentence was corrected in the same pass. Original finding: Angle
  CRUD, model-provider/format-profile tables, archetype serving
  endpoints, ShotRecipe table, GeneratorProfile, Completion
  Certificate, Corrections Log, proposedBibleEdits, account
  deletion, project export, file uploads, email provider +
  verification/resend flows, YouTube token store/scopes/disconnect/
  quota/video-matching, and webhook definitions were all promised
  but unspecified.
- **A11 Deliverable list mismatch.** ✅ **RESOLVED 2026-10-27**
  (user's design): Shared §5 now holds the single canonical
  `PACKAGE_DELIVERABLES` table — **19 deliverables + 2 package
  records (completionCertificate, generatorProfile) = 21 entries**,
  each with a stable key, kind (file / record / both), inclusion
  rule, and origin (WORKFLOW original 15 / Phase 4 adoptions /
  Phase 5 certificate / G10 / Q7 captions phasing, under which
  captionsSubtitles' MVP content is narration text + timing plan).
  Reconciliation: the API's 19 was complete for files; Shared was
  missing viewerGlossary (now included); WORKFLOW's 15 is the
  historical subset — WORKFLOW.md now carries a provenance header
  (original source document; specs govern) and its Step 14 points
  to the canonical list with the original 15 preserved as a
  historical note. API Step 14 and Web §10 reference the canonical
  keys instead of restating them. Records are rendered to files
  for the ZIP and embedded structured in the manifest. Keys are
  immutable (renames ship as new key + alias map; existing package
  manifests are untouched snapshots); the builder rejects unknown
  keys and CI typechecks against the list. One flagged note, kept
  visible in Shared §5: the inclusion conditions for
  entityReferenceSheet/legalReviewSummary derive from their Phase
  4 content definitions — no separate decision exists. Original
  finding: API = 19 keys, Shared omitted viewerGlossary, WORKFLOW
  still listed the original 15 and ignored the captions decision.
- **A12 Character data has two homes.** ✅ **RESOLVED 2026-10-27**
  (user's design): the **Character Registry is the canonical living
  home**; the Bible's Character Annex keeps **portrayal rules only**
  (portrayal rules + dialogue policy). Every locked Bible version
  carries an immutable `characterSnapshot` of all registry entries
  at lock time (entryId + entryVersion + full data); editing the
  registry never alters a locked version or a past run, and each run
  records its bibleVersionId + snapshot + the entry versions its
  scenes used, so an earlier run's configuration reproduces exactly.
  Drift is surfaced (`GET …/character-drift`, Web snapshot panel +
  badge + per-entry diff) and included only deliberately, by
  creating a new Bible version through the approval flow. The two
  shapes are reconciled into the single `CharacterEntry`
  (REGISTRY_MAP Type 1): `identity` → `identitySummary`,
  `appearanceLockedDescription` retired for
  `lockedAppearanceDescription`, annex timeline/relationship map →
  entry `lifeTimeline[]` / `relationships[]`. Pre-A12 annex data
  migrates into the registry once; same-character conflicts are
  preserved in both copies and flagged (`migration_conflicts`) for
  user resolution — nothing silently discarded. Acceptance criteria
  in API §11. Written: REGISTRY_MAP Type 1, Shared (CharacterEntry +
  characterSnapshot), API §5, Admin §8 (annex template = rules
  fields only; seed template's data fields retired), Web §4.
  **This completes the A block: all 12 build-blockers resolved.**
  Original finding: the registry lived "inside the character annex"
  (Bible-versioned) AND as a standalone RegistryModule.

## B. Stale / contradictory text — ✅ SWEPT 2026-10-27
Done in themed batches under the user's instruction: every item
below was fixed where a confirmed decision gave an unambiguous
answer (decisions cited per batch in the fix programme notes);
the only content left open is the taxonomy source-data itself
(legacy ID 443 naming two niches + 35 parent/sub-niche ID
collisions — flagged in docs/seeds/VALIDATION_REPORT.md since A7;
the merged list's header/notes now describe placement honestly
instead of claiming a false "exactly once"). Original items:

- Web §14 + Admin §18 still list resolved decisions as open
  (billing provider, manual Step 15, support role).
- Billing artefacts vs no-provider decision: /pricing, invoices,
  credit packs with prices, refunds "after provider refund",
  "subscribers", Admin dashboard "packs sold"; Web's
  insufficient-credits path dead-ends at a nonexistent top-up —
  reframe as admin-granted credits and say so in Web.
- Admin §13 says user channel data is "entered/imported only" —
  contradicts YouTube OAuth sync (Q6).
- "Control Rules 11, 13" cited; only 12 rules exist (README/WORKFLOW).
- README status stale (Notion exists; GitHub is "on hold by user",
  not "review first"); README tree lists phantom packages/ui +
  packages/config.
- NICHE_LIST.md (v1) unmarked as superseded in its own header;
  WORKFLOW.md unmarked as the original source doc (Phase 1–8 vs
  Steps 1–17 language); PHASE review docs lack "adopted" banners;
  CONFIG_QUESTIONS.md keeps the superseded first pack section with
  old keys (e.g. `tutorial_vs_explainer`) beside the full definitions;
  REGISTRY_MAP main body never updated in place (Type 11, variants,
  state tables, camera geography live only in addenda).
- NICHE_LIST_MERGED self-contradictions: [443] appears as a niche
  twice; several IDs used for both a niche and its own sub-niche;
  the [496] cross-reference note is wrong; "exactly once" header vs
  591 ID occurrences (incl. sub-niche mentions — header should say
  "once as primary placement" and the file should mark mentions).
- Name drift: `lockedAppearanceDescription` (Registry Map) vs
  `appearanceLockedDescription` (API annex) + two Character shapes;
  Scene fields `estimatedVoSeconds` (doc) vs `estimatedVoSec` (API)
  and `durationEstSec` vs `durationEstSec`/`estimatedDurationSec`,
  doc never mentions `retentionNote`; Visual archetype schema called
  "14 fields" once (it's 10); Master Lists "7 for every project" vs
  Registry Map "5 + 2 where relevant"; Generator Profile per-project
  (file 24 mapping) vs per-run (G10/API) — name both distinctly;
  Verified Data schema lacks the G7 `methodologyNote`;
  CONFIG_QUESTIONS expanded options re-create a duplicate dimension
  (`delivery_format` vs B13 `video_format`) and depth_level wording
  differs between sections; Layer A/B "14/18" count labels that
  bundle 2 records each (importer needs 16/20 stated).
- Job model holes: no `cancelled` status (Admin can cancel);
  credit rules undefined for cancellation, partial range results,
  fallback-model cost differences, admin retries; `jobConfirm` body
  missing from several endpoint payloads; FEATURE_DISABLED and
  dedupe-409 missing from the §2 error-code list; BIBLE_CONFIRM
  stage can never complete when no newer Bible exists; Step 17
  attach-order self-contradiction; typed-vs-dynamic config
  relationship ("alongside") undefined — which is authoritative and
  how `mapsTo` writes through; `asset_method` used but never
  defined as a field; PerformanceRecord "1—1 latest with history"
  contradiction; Shared claims sole ownership of enums it never
  enumerates (audit area keys, stage statuses) and PIPELINE_STEPS
  (17) vs API RunStages (12+2) have no mapping.

## C. Improvements — REVIEWED 2026-10-27 (themed batches per user instruction)
Resolved from existing decisions (written into the specs):
notifications spec (API §10: 12 types, in-app + email subset,
per-type prefs); Angle selection screen spec + no-angles empty
state (Web §4); Admin route map completed (/annex-templates,
/taxonomy/:nicheId/questions) + "contact user" channel defined
(transactional email via Admin, audit-logged — Admin §5); registry
folds (Place cameraGeography in Part A; reviewDate/reviewBy on
Knowledge variants; priceAsOf on Product); Production Detail
completeness aligned — the API now validates the standard's 6
fields, not 2; visual mapping resolution order stated
(niche > category > A13 default; project Bible overrides on top);
rate-limit headers + concurrent-job cap, refresh-token rotation
with reuse detection, dedupe confirmDuplicate parameter, JobAction
enum (API §7 + Shared). Account-settings depth was already covered
by A10 + the notifications spec above.
**D5 Dual-archetype tie-break — RESOLVED 2026-10-27 (user
decision): FIELD SPLIT.** Primary owns Visual Language,
Camera/Lens, Motion, Thumbnail; secondary owns Palette, Lighting,
Texture, Graphics (Graphics assigned via documented configuration,
Admin-editable); AI Prompt Keywords + Avoid are UNION fields (an
Avoid-vs-require clash is an incompatibility flagged for review).
Owner-missing → compatible fallback to the other archetype → the
default chain. Every resolved field records its source; precedence
chooses the mapping row first (niche → category → A13), the split
resolves within the pair, project Bible overrides apply last per
field and survive re-resolution (new Bible version only); locked
runs stay frozen. Validation of existing rows: most "duals" are
replacement overrides or contextual splits (Geography A1 maps /
A10 places); two rows FLAGGED ambiguous in the seed
(dualMappingReview) — Music history "A6/A13 by era" (no boundary)
and Farming "A14/A10" (primary unstated) — resolving by category
row until decided. Written: VISUAL_STYLE_SYSTEM (rule + owner
table + 4 worked examples), Shared (fieldSources), API (resolution
+ acceptance), Admin §8 (mapping editor display), seed
(fieldOwners + dualMappingReview).
**THE C BLOCK IS NOW FULLY RESOLVED** — every item either written
from confirmed decisions or decided by the user (D1–D5). The full
DESIGN_AUDIT programme (A + B + C) is complete. Remaining known
open items anywhere: the taxonomy legacy-ID data (443 + 35
collisions — user's content decision), the angle seed import
(awaits the user's unshared 500-niche file), the two flagged
visual rows above, Part C registry-overrides seed extraction
(structure ready), and build-time engineering choices in API §12
(framework/queue/storage).
**D4 Data Viz Annex — RESOLVED 2026-10-27 (user decision):**
structured annex with a versioned `dataVizSpec` per chart scene
(canonical schema: docs/SCENE_BREAKDOWN.md; DTO: Shared). Fields:
purpose, series (values + unit + sourceRef to a Verified Data
entry or verified claim — unlinked = `missing_evidence`, values
never invented), category labels, time period, axis/scale rules
(bar/column zero-baseline unless an annex override note), the
mandatory on-chart sourceNote, and accessibility keyFindingText.
Chart vocabulary is Admin-managed + versioned (seed v1: bar,
column, line, area, pie, scatter, timeline, map, table,
statCallout — each with required fields); runs snapshot schema +
vocabulary versions. Invalid/incomplete specs block scene
completion with the exact gap named; unsupported chart types save
as `dataVizRequest` drafts queued for Admin review — never
silently substituted. Written: SCENE_BREAKDOWN (schema + 4 worked
examples), Shared, API (validation + §11 acceptance), Admin §8
(vocabulary home), Web §8 (editor states), seed
annex_templates_seed.json (vocabulary added; schema flag closed
in VALIDATION_REPORT).
**D3 Lifecycle exits — RESOLVED 2026-10-27 (user decision):**
archive-first lifecycle (API §4A, Web §3B, Shared LifecycleStatus):
archive = owner-only, reversible, read-only, excluded from active
lists, never touches credit/ledger history; delete = owner-only
with a naming confirmation, 30-day recoverable soft delete for
BOTH projects and runs, then purge (artifacts/files/exports go;
ledger entries + AdminAuditLog retained; Do-Not-Repeat entries
from a deleted run remain, marked; downloaded exports unaffected;
backup copies expire by rotation). Jobs: archiving/deleting
cancels queued (holds released) + running at unit boundary (§7
rules), no new jobs on archived/deleted items, restore never
auto-restarts. Drafts auto-expire after 30 days inactive with
last-saved/expiry shown + resume/discard. Retry = existing
estimate+confirm, per-unit, no double-charge. Suspended accounts:
ACCOUNT_SUSPENDED 403, jobs cancelled per above, data intact, one
suspended screen with the contact path. **Conflict check: none —
the 30-day pattern matches A10 account deletion, which still
purges at the account level.**
**D2 Onboarding — RESOLVED 2026-10-27 (user decision):** full
onboarding written (Web §3A + API §3): verification flow under the
A10 gate, identical password rules at signup/reset/settings
(min 10, strength meter, breached-password check via k-anonymity;
check unavailable → accept on strength + log + notice), forgot/
reset screens, first-project empty state, a read-only SAMPLE
project (complete topic→package journey, no jobs — SAMPLE_READ_ONLY
403; explicit Duplicate-as-my-project action), and a skippable
YouTube-connect step (read-only scopes, failure/cancel never
blocks onboarding, full workflow usable unconnected). Acceptance
criteria in API §11 for connected and unconnected users.
**D1 Brand collaboration — RESOLVED 2026-10-27 (user decision):**
Brand teams explicitly deferred until after the Personal MVP;
Brand ships solo — the owner performs every approval transition
themselves (Draft → In Review → Changes Requested → Approved →
Final), each recorded in the script's approval history (actor,
timestamp, note; Changes Requested requires a note, Final locks
the version). No invites, member roles, shared access or comments
exist or are implied in MVP. Written: Web §2 (solo flow +
deferral), API §4 (brand-approval endpoint, owner-only), Admin §1
note (platform admin roles ≠ Brand roles).
Angle seed data still depends on the user's unshared
YOUTUBE_NICHE_MASTER_DATABASE_500.md (Admin CRUD path exists).
Original items:

- Brand collaboration is promised ("Later: team member/approver")
  but undesigned: invite flow, member roles, review/comment UI,
  campaign UI (list/create/link) — either design a minimal version
  or explicitly defer Brand teams post-MVP in Web §2.
- Onboarding: email verification flow, password rules, forgot-
  password screens, first-project empty state, sample project,
  YouTube-connect step — one short Web section.
- Account settings depth: email/password change, account deletion
  UX, YouTube disconnect, notification types/channels/triggers
  (job done, audit failed, credits low) + a notifications spec.
- Lifecycle exits: project/run archive/delete/close semantics,
  abandoned wizard drafts, per-step retry outside Steps 12–13,
  suspended-user screen state.
- Angle selection needs a real screen spec in the Step 4 row
  (picker, story question, scope display) — currently buried in §4.
- Admin route map: add /annex-templates + /taxonomy/:nicheId/
  questions; "contact the user" needs a defined channel.
- Data Viz Annex: give it a field schema + chart-type vocabulary +
  explicit link to scene dataVizSpec.
- Registry Part A schemas: fold G2/G3/G5 fields in properly; add
  `reviewDate/reviewBy/priceAsOf` fields the category notes assume.
- Production Detail completeness: API validates narration+visual
  only; the standard mandates 6 fields — align the completeness
  function with the standard (or relax the standard explicitly).
- Visual mapping: state the category-inheritance rule + dual-
  archetype tie-break; per-niche rows exist for only ~20 niches.
- Angle seed data: none exists — depends on the user's unshared
  YOUTUBE_NICHE_MASTER_DATABASE_500.md; until shared, run creation
  needs a "create angle" path in Admin (CRUD in A10 covers it).
- Rate-limit specifics (header names, values, concurrent-job cap),
  JWT refresh/rotation, dedupe-409 confirm parameter, job-estimate
  action enum.

## D. Verified healthy (checked, no action)
Bible = 14 sections with identical keys in API + Shared; Master
Lists = 7 in API + Shared; all docs/*.md cross-references resolve
to real files; Notion has a proper home for every design doc
(subpages 01–10 + hub decisions); question-pack seed JSON is valid
and complete (12 packs/29 questions, v2.2 custom-answer flags).

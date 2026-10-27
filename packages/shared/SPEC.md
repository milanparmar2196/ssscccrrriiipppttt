# Shared Package Spec — packages/shared

Single source of truth for types/enums/constants used identically by
`apps/web`, `apps/admin`, and `services/api`. If a value exists in two
apps, it is defined here once. No UI, no I/O, no framework code in this
package — types, enums, zod-style schemas (or equivalent), and pure
helper functions only.

## Contents

### 1. Workflow definitions
- `PIPELINE_STEPS`: ordered array of the 17 master steps with
  `{ stepNo, key, phase, label, approvalGate: boolean, optional: boolean }`.
  Order is exactly the Final Pipeline in `docs/WORKFLOW.md`.
- `PHASES`: Phase 1–8 grouping of steps 1–15; optional modules 16–17 flagged.
- `RunStage` enum + `StageStatus` enum + `STAGE_DEPENDENCIES` map
  (stage → stages that must be `done` first) — API enforces it, web/admin
  import the same map only to explain lock reasons (never to decide them).
- `APPROVAL_STAGES`: topic selection, research, outline, final approval.

### 1A. Fully dynamic definitions (no hard-coded lists)

User decision (2026-10-27): personal project, fully dynamic, no limits.
This package defines only the *shapes* for taxonomy and questions —
never an enumerated list of niches, sub-niches, tones, or questions.
It exports `ConfigQuestion`, `QuestionType`, `QuestionScope`,
`QuestionCondition`, `PresetItem`, `NicheQuestionAssignment`
(`mode: assigned|cloned`), and `NicheTemplate` types —
`ConfigQuestion` includes `allowCustomAnswer` and the answer payload
supports `{ value: "custom", customText }` for choice questions
(docs/CONFIG_QUESTIONS.md v2.2) — a template is
`{ nicheId, subNicheId?, scope: global|personal, isDefault, version,
sections: { strategyDefaults?, configurationDefaults?, bibleTemplate?,
questionsSetRef?, researchTemplate?, structureTemplates?,
sceneTemplate?, auditAddons?, packagingDefaults?, registries? } }`
— **10 sections**, every section
optional and independently applicable. The `registries` section
(A8, 2026-10-27) is `TemplateRegistriesSection | null`:
`{ mode: "explicit", primary: RegistryType, secondary:
RegistryType[] }`. **`null`/absent means inherit** (the niche's
registry set resolves from the per-niche override if one exists,
else the category map — docs/REGISTRY_MAP.md); an explicit section
replaces primary + secondary for the template's niche, and
`secondary: []` is an **intentional** "no secondary registries",
distinct from inheriting. Per-niche overrides are
`NicheRegistryOverride { nicheId, primary?, secondary?, note? }`,
stored at Admin level (seeded from Registry Map Part C) — plus a runtime validator
for a `ConfigQuestion` and for an answer payload against a question
schema. Web's Dynamic Form, Admin's Question Builder, and API validation
all use these same types — that is what makes "add it in Admin and it
appears in the user flow, uncapped" work end to end.

### 2. Core DTO types
`User, Plan, CreditLedgerEntry, WorkspaceProject (Personal|Brand),
Niche, SubNiche (+Overrides), AudienceStrategy, ProjectConfiguration,
ToneConfig, LanguageConfig, VisualStyleConfig, ProductionBible
(its `sections` object has the canonical 14 keys defined in API Spec §5:
channelPromise, audiencePersona, toneBible, languageBible, visualBible,
structureBible, packagingBible, complianceBible, voiceNarrationBible,
glossaryPronunciation, musicSoundBible, seriesContinuityBible,
researchEvidenceStandards, performanceLearningsLog) plus `annexes[]`
of `BibleAnnex` instances built from `AnnexTemplate` definitions
(built-in keys: monetizationSponsor, accessibility, character, and
niche-created subject annexes — the key list is data, not an enum),
`CharacterEntry`, and dynamic annex field-definition types.
**Character data (A12):** `CharacterEntry` (the REGISTRY_MAP Type 1
shape — name, aliases, role main|supporting|recurring, era,
identitySummary, traits, motivations, relationships, lifeTimeline,
lockedAppearanceDescription, imagePromptSuffix, variants,
designStatus, negativePrompt, portrayalNotes, sensitivityNotes,
dialoguePolicyRef, plus entry versioning) is the **canonical
living record**, held in the project's Character Registry. The
Bible `character` annex holds **portrayal rules only**
(portrayalRules, dialoguePolicy). Each Bible version additionally
carries a `characterSnapshot`: `{ capturedAt, entries: [{ entryId,
entryVersion, data }] }` — an immutable copy of every Character
Registry entry at the moment the version was locked (present only
when the project's registry set includes character).
Master Lists: `BibleMasterListKey` (sourceList, doNotRepeat,
masterTimeline, locationSettings, hookOpeningLibrary, phraseBank,
assetSourceList) and the 7 entry DTOs; Registries:
`RegistryType` (character, place, knowledge, caseEvent, creature,
storyWorld, organisation, product, concept, work, propsWardrobe),
`RegistryModule`,
the **11 registry entry DTOs** (one per RegistryType, including
`PropsWardrobeEntry`), and the `Angle` DTO
(slug/angle/question/scope/evidence/boundary); `VisualArchetype`
(10-field style schema) + `VisualStyleAssignment`
(archetypeId/version/overrides) — for dual-archetype rows (D5) the
assignment carries `primaryArchetypeId` + `secondaryArchetypeId`
and the resolved style carries `fieldSources` (per-field
`{ source: primary|secondary|union|project_override|default,
archetypeId }`, docs/VISUAL_STYLE_SYSTEM.md), `OutputFormatProfile` (per-tool
handoff format rules, docs/OUTPUT_FORMAT_PROFILES.md),
BrandProfile, Product, BrandGuideline, Campaign, Topic, TopicScores,
ResearchBrief, Source (A5 fields: `credibilityTier` 1–5|null,
`reviewStatus` approved|pending|blocked, `origin`:
library|project|user_supplied|web_discovered — always carried and
displayed separately), Claim (+ClaimStatus;
passage-level: `sourceLocation`, `accessedAt`, `confidence`,
`riskLevel` — docs/PHASE1_RESEARCH_REVIEW.md), `ResearchMode`
(curated_first|curated_only|web_only|selected_only), SourceLibraryEntry,
SourceBundle, NicheCoverage (not_assessed|needs_sources|partial|ready),
ResearchGap (docs/RESEARCH_SOURCES.md), `SimilarityMatch`
(entityType/entityId/title/semanticScore/keywordScore/context) and
`SemanticStatus` (complete|keyword_only|unavailable|stale_model) for
the embedding-based checks (docs/MODEL_PROVIDERS.md §5),
Outline, OutlineSection,
AdminUser (A9: `email, passwordHash (never serialised), role:
admin|super_admin, status, mfaEnabled, mfaSecretRef?` — plus the
reserved actor identity `bootstrap` used only in audit
attribution), Script, ScriptSection, Scene, AuditReport (A4 scoring:
`areas{}` each with `score`, `weight`, `effectiveWeight`; `total`;
`weightConfigVersion`; `completeness: complete|incomplete`;
`blockedByCritical`; per-deliverable Editorial Depth verdicts kept
**separate** from the score), AuditArea, AuditCheck
(+ `critical` flag), AuditWeightConfig,
ProductionPackage, PackageDeliverable, PackageFile, PerformanceRecord,
PerformanceInsight, AssetItem, PublishingOutput, Job, OpenIssue, ModelProvider,
ProviderModel, StageModelAssignment`

Every DTO: `id`, `createdAt`, `updatedAt`; versioned DTOs add
`versionNo`, `isCurrent`. Money/credits are integers (credits) — no floats.

**DataVizSpec (D4):** the Scene DTO's `dataVizSpec` is the
structured, versioned chart specification defined in
docs/SCENE_BREAKDOWN.md (schemaVersion + vocabularyVersion,
chartType from the Admin-managed vocabulary, series linked to
Verified Data entries or verified claims, axis/scale rules,
mandatory on-chart sourceNote, accessibility keyFindingText) —
plus `dataVizRequest` for not-yet-supported visualizations
(draft, scene cannot complete). This package owns both shapes;
validation rules live in the API (§6 Step 11) and the Audit
checks them.
**Scene v2** (docs/SCENE_BREAKDOWN.md): the Scene DTO carries
`claimIds[]`, `sourceRefs[]`, `legalRiskFlag`, `registryRefs`
(character/location/prop registry IDs), `chapterId`, `periodLabel`,
`dataVizSpec?`, `speakerLabel`, `voWordCount` and `estimatedVoSec`
alongside the visual/prompt/direction fields — scenes cite research
claims and locked registry entries rather than free-text names.
**v2.1** (docs/PHASE2_ADDITIONS.md): + `continuityState {startState,
endState}`, `referenceInputs[]`, `editorialOverlayInstructions`,
`shotRecipeId?`; registry entries gain character variants, depiction
classes, props state tables, place camera geography; new DTOs
`ShotRecipe` and the per-run `GeneratorProfile` record.
**A10 DTOs:** `CompletionCertificate`, `CorrectionsLogEntry`,
`Upload` (file metadata + state: initiated|uploaded|verified|
failed|expired), `YoutubeConnection` (**status fields only** —
channel ref, scopes, status: connected|reauth_required|
quota_exceeded|disconnected, lastSyncedAt; token material is never
part of any DTO), `WebhookSubscription`, `ProposedBibleEdit`
(target section, diff payload, status: pending|approved|rejected).

### 3. Shared enums / preset shapes
- `ProjectType: personal | brand`
- `Platform: youtube_long | youtube_shorts | reels | tiktok | podcast_script | other`
- `ClaimStatus: verified_fact | assumption | speculation | conflicting`
- `TopicStatus`, `JobStatus: queued | running | done | failed |
  cancelled` (cancellation credit rules: API §7), `PackageStatus:
  ready | outdated`, `LicenseStatus`, `AuditCheckStatus: pass |
  fail | warn | na` (`na` always carries a reason — a check that
  doesn't apply to the niche/platform is recorded, never silently
  skipped)
- `AuditAreaKey` (this package owns it — A4): factualAccuracy,
  sourceReliability, originality, narrativeCoherence, engagement,
  pacing, continuity, productionFeasibility, repetition,
  durationFit, bibleCompliance, brandCompliance (Brand projects
  only). Area weights live in the versioned `AuditWeightConfig`
  (Admin §7 / API Step 12).
- `LifecycleStatus: active | archived | pending_deletion | deleted`
  (projects and runs, D3 — archive/delete semantics in API §4A)
- `JobAction` (one per Job-creating endpoint, API §7):
  topic_generate, topic_evaluate, research_run, bible_generate,
  outline_generate, script_generate, scene_generate, audit_run,
  audit_autofix, package_generate, asset_research,
  publishing_generate, insights_generate, embedding_index,
  export_generate.
- `StageStatus: locked | ready | in_progress | awaiting_approval |
  done | needs_revision | blocked` and the **PIPELINE_STEPS ↔
  RunStages mapping**: the 15-step master pipeline (+ optional
  16/17) maps to run stages as — steps 1–3 project-level (no run
  stage); 4–5 `topics`; 6 `config` (+ `bible_confirm` gate when a
  newer Bible version exists, §4); 7 `research`; 8 is the project
  Bible (run stage: none — the run snapshots it); 9 `outline`;
  10 `script`; 11 `scenes`; 12–13 `audit`; 14 `package`; 15
  `performance`; 16 `assets` (optional); 17 `publishing`
  (optional). Stage order and gates are enforced by the API (§4).
- Preset item shape (niches, tones, visual styles, hooks, structures,
  CTAs): `{ key, label, description, version }` — content is managed in
  Admin/API; this package defines only the shape.

### 4. Validation schemas
Shared request/response schemas for every API resource in
`services/api/SPEC.md` §3–§9, so web forms, admin forms, and API
validation can never drift. Scene schema enforces field presence;
"complete scene" is a derived check (`isSceneComplete(scene)`), used by
API for stage gating and by web for the totals bar — same function.

### 5. Pure helpers
- `estimateDurationSec(wordCount, pacing)` — one implementation, used
  everywhere duration is shown or checked.
- `isStageLocked(stageMap, stage)`, `lockReason(stageMap, stage)` —
  presentation helpers over the API-returned stage map.
- `PACKAGE_DELIVERABLES` — **the single canonical definition** of
  Production Package contents (A11, 2026-10-27). API, Web, the
  package builder and all docs reference this list; none maintains
  its own. Each entry: `{ key, label, kind: file|record|both,
  inclusion, origin }`. Reconciliation of the three former lists
  (API's 19, Shared's 18, WORKFLOW's original 15): the API list was
  complete for files; Shared was missing `viewerGlossary`; the
  workflow list is the historical subset. Canonical total: **19
  deliverables + 2 package records = 21 entries**:

  | key | kind | inclusion | origin |
  |---|---|---|---|
  | finalScript | file | core — always | WORKFLOW Step 14 |
  | sceneBreakdown | file (DOCX/PDF + CSV) | core — always | WORKFLOW Step 14 |
  | productionChecklist | file | core — always | WORKFLOW Step 14 |
  | projectSummary | file (front sheet, from the manifest) | core — always | Phase 4 adoption A5 |
  | completionCertificate | record + rendered file | core — always (issued at Final Approval) | Phase 5 adoption |
  | generatorProfile | record (+ in manifest) | core — always (run snapshot) | Phase 2 G10 |
  | voInstructions | file | required set (checklist) | WORKFLOW Step 14 |
  | visualRequirements | file | required set | WORKFLOW Step 14 |
  | aiPrompts | file | when the run's production method uses AI-generated assets | WORKFLOW Step 14 |
  | shotDirections | file | required set | WORKFLOW Step 14 |
  | musicSfxCues | file | required set | WORKFLOW Step 14 |
  | onScreenTextGraphics | file | required set | WORKFLOW Step 14 |
  | captionsSubtitles | file | required set; MVP = narration caption text + timing plan, timed SRT/VTT later (Q7 decision) | WORKFLOW Step 14 + Q7 |
  | titleSuggestions | file | required set | WORKFLOW Step 14 |
  | thumbnailConcepts | file (text) | required set | WORKFLOW Step 14 |
  | descriptionMetadata | file | required set (incl. Monetization disclosure checklist when that annex is active) | WORKFLOW Step 14 |
  | researchReferences | file | required set (citations by scene + bibliography by credibility tier) | WORKFLOW Step 14 + Phase 4 A3 |
  | editingInstructions | file | required set | WORKFLOW Step 14 |
  | entityReferenceSheet | file | when the run used registry entities (compiled from those registries) | Phase 4 adoption A1 |
  | legalReviewSummary | file | when the run carries legal flags / high-risk claims (its content source) | Phase 4 adoption A2 |
  | viewerGlossary | file | when the run used Bible §10 glossary entries | Phase 2 G10 |

  "Required set" = computed by the Package checklist from project
  output requirements + run facts (the existing master rule: only
  selected/required deliverables are built); core entries cannot be
  deselected. **Records in the package:** the Completion
  Certificate and Generator Profile are structured records first —
  the package renders each to a human-readable file for the ZIP and
  embeds the structured record in the manifest, so integrations
  read the record, not the render. **Key stability:** keys are
  immutable once shipped; a rename ships as a new key + a
  `PACKAGE_DELIVERABLE_ALIASES` entry, existing packages keep the
  manifest they were generated with (manifests are snapshots), and
  the API resolves aliases on read. **Consistency check:** the
  package builder validates every requested/built key against this
  list (unknown key = build error), and monorepo CI typechecks API
  + Web against it — a doc or screen naming a non-canonical key
  fails the build. (One flagged note: the inclusion conditions for
  `entityReferenceSheet`/`legalReviewSummary` follow from their
  content definitions in the Phase 4 adoption; no separate decision
  exists — recorded here, not hidden.)

## Rules
- Breaking change to any exported type/enum = version bump + changelog
  entry in this file; web, admin, and API must move together (monorepo CI
  typechecks all three against this package).
- No app may define a local copy of a pipeline step name, stage status,
  or audit area key. Lint rule enforces imports from this package.

## Acceptance
- Renaming/reordering a pipeline step requires editing only this package
  + `docs/WORKFLOW.md`; all three apps pick it up by typecheck.

# Review — MASTER_Phase2_ProductionBible.md + the 39 Bible files (2026-10-27)

> **Status (2026-10-27): REVIEW COMPLETE — the adopted items from this review are integrated into the specs/docs named inside; rejected items and their reasons are recorded here. This file is the review record, not a live spec.**

All 40 files read in full (master by parent; 39 files by three
parallel reviewers). **Headline: the name-based mapping
(docs/BIBLE_FILE_MAPPING.md, §55) is confirmed by content — every
file lands in a layer we already have.** Most of the 39 are
*templates/stubs* (purpose + field structure + a "completion
evidence" line + shared boilerplate), not filled content. The master
file is a per-episode Bible (16 files regenerated per video); ours
is a reusable Project Bible with run snapshots — the SaaS-correct
model, unchanged. But the templates' field-level detail contains
genuinely new items, grouped below as 10 adoption packages.

## Adoptions proposed (G1–G10)

- **G1 Scene continuity states (file 10 + Props + Appearance Lock):**
  Scene gains `continuityState` with **start/end state** (no silent
  resets of age, damage, clothing, possession, geography),
  `referenceInputs[]` (reference asset IDs per scene) and
  `editorialOverlayInstructions` (exact text/graphics planned as
  overlays, never left to generated lettering).
- **G2 Character variants & depiction classes (Appearance Lock, Main/
  Supporting Characters):** registry variants scoped by story
  date/event + scene range with persistent features; design status
  proposed vs approved (with approval evidence); per-character
  negative prompt/exclusion brief; expression/gesture sheet;
  **mention-only** depiction class (audience-information progression
  without an invented performed arc).
- **G3 Props state transitions (Props/Costumes):** before/action/
  after state table per prop entry (reveal, transfer, damage,
  repair, costume change), owner/wearer per scene, duplicate/reset
  checks in Audit continuity.
- **G4 Knowledge states & causality failures (Relationships/
  Timeline):** timeline tracks what each character *knows* at each
  point; Audit continuity gains the failure taxonomy — premature
  recognition, knowledge before explanation, object reset,
  impossible overlap, unrecorded cast entry.
- **G5 Place camera geography (Locations):** Place dossiers gain
  defined camera positions (wide/medium/detail, reverse-shot rules);
  rule: crops/reverses are *views*, not new settings.
- **G6 Shot Recipe Library (Camera/Animation Guide):** per-project
  reusable shot recipes with stable IDs (SHOT_001…) that scenes
  reference, + spatial continuity fields (screen direction,
  eyelines, action axis) — extends the Camera & Animation standard;
  a recipe never replaces the scene's own visual direction.
- **G7 Guide enrichments (files 01/02/04/05/06, Music):** Source DTO
  gains `versionTranslationLimits`; Verified Data entries gain a
  `methodologyNote` (e.g. CPI adjustment); Accessibility gains
  **safe area** + **colour-independent labels** (pattern encoding),
  semantic colour code as a Finance/Data annex default; appearance
  **departure log** (artistic departures from sourced appearance
  recorded explicitly); per-character **voice specs** keyed by
  character ID + voice-imitation consent boundary; **silence** as an
  explicit recorded music cue value.
- **G8 Originality, external (Originality Review):** the Audit
  Originality area gains an external comparison standard — bounded
  scope, works actually inspected (titles/URLs/dates, full content
  or transcripts, never snippets), limitations recorded visibly,
  verdicts per-run and non-transferable.
- **G9 Beat coverage + per-artifact readiness (Beat Map, Editorial
  Depth template, Detail Standard, Workflow Guide):** invariant —
  beats map to contiguous scene ranges, every scene covered exactly
  once, beat claim IDs = union of scene claim IDs (outline↔scene↔
  claim reconciliation check); Editorial Depth Review gains a
  per-deliverable four-state verdict (Needs work / Ready as text /
  N/A with reason / Not reviewed) + the prompt-smuggling check
  (prompts must not introduce unplanned figures/objects/text/
  events) + worked failure/correction examples as completion
  evidence; N/A hardening — a **non-waivable core set** (identity,
  evidence, narration, delivery, review records can never be N/A)
  and N/A reasons must be substantive.
- **G10 Package & publishing records (Handoff, Generator Profile,
  Asset Register, YouTube Metadata, Workflow Guide, master Rule 11):**
  handoff clip accounting upgraded (child clips keep parent scene
  ID, durations sum to parent, join/handle plan; AI imagery never
  labelled archival/evidence); per-run **Generator Profile record**
  (selected tool/model/version + capabilities verified with date +
  source, reference-input order) as the instance companion to
  Format Profiles; AssetItem gains `checksum`, fonts + narrator as
  asset types; **Viewer Glossary as a published deliverable**
  (per-run sourced, linked from description/transcript); **pinned
  comment** deliverable; post-publication **Corrections Log** per
  run (Step 15); publication record fields stay **Pending** until
  real (never invent URLs/approvals); prior Package versions
  retained (history), fingerprint includes toolchain version.

## Conflicts (all already resolved against, restated for the record)
1. **Fixed 32-document manifest** repeated as boilerplate in nearly
   every file — a hard document set; directly against the fully
   dynamic decision. Our records/deliverables are data-driven.
2. **FIXED 8-second locks + exact duration sums** (master, files
   00/10) — narration-led stands; durations are estimates + audit.
3. **Phase order** in WORKFLOW_GUIDE (compile package → audit) —
   ours is audit → approval → package.
4. **DELIVERY_CHECKLIST rendered-media gates** (export checks,
   release gate) — outside the script-only platform; only its
   text/caption planning maps in.
5. **Per-episode Bible regeneration** (master) — ours: one locked
   Project Bible, snapshotted per run.
6. Master-internal issues: sub-genre VO paces of 170–190 WPM
   contradict its own 140–160 standard (and Phase 3's "never above
   170"); Q42 used for both scene duration and file naming in the
   locks list while file 00 itself says Q42 never means file naming;
   the 10-style visual catalog is production *methods* (incl. live
   interviews/filming) — maps to asset method, not our archetypes.

## Not adopted
Business-only content (Quick Reference domains/keywords, finance
colour/SEO specifics beyond annex defaults), audio recording QA
(sample rates, measured mixes — external production), take logs.

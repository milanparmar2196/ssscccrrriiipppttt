# Phase 2 Files — Integrated Additions G1–G10 (2026-10-27)

Canonical detail for the additions adopted from the user's
MASTER_Phase2_ProductionBible.md + 39 Bible files
(review: docs/PHASE2_FILES_REVIEW.md). Specs reference this doc.

## G1 Scene continuity & overlays (Scene DTO v2.1)
- `continuityState { startState, endState }` — free-structured state
  notes (age, damage, clothing, possession, geography, knowledge);
  a scene's endState must equal the next scene's startState unless a
  stated transition explains the change (Audit continuity check).
- `referenceInputs[]` — reference asset/registry IDs the scene's
  visuals must match (character/place/prop reference versions).
- `editorialOverlayInstructions` — exact on-screen text/graphics are
  produced as overlays in editing; AI prompts must not rely on
  generated lettering for charts, quotations or captions.

## G2 Character variants & depiction classes (Character Registry/Annex)
- **Variants:** each character entry may carry variants[] { variantId,
  label, storyDateOrEvent, sceneRange, allowedChanges,
  persistentFeatures } — e.g. younger/older, injured, disguised.
  A variant applies only inside its scope; changes outside a variant
  are continuity failures.
- **Design status:** proposed | approved, with approval evidence
  recorded; a lock is never "approved" without evidence.
- Per-character **negative prompt / exclusion brief** (must not forbid
  expressions/actions a scene requires) and **expression/gesture
  sheet** fields; the consistency prompt is a standalone artifact,
  distinct from scene-action prompts.
- **Depiction classes:** depicted | mention_only | absent.
  Mention-only figures get an audience-information progression, never
  an invented performed arc.

## G3 Props & Wardrobe state transitions (Registry Type 11)
- Each entry gains a **state table**: rows { sceneRange, state,
  ownerOrWearer, change (reveal|transfer|damage|repair|costume_change|
  none), note } incl. persistent offscreen state. Audit checks:
  no duplicate or silently reset objects; visually similar objects
  explicitly distinguished; invented staging labelled as proposal.

## G4 Knowledge states & causality failures (Timeline + Audit)
- Master Timeline / character timelines may record **knowledge
  states** (what a character knows from which event onward).
- Audit Continuity failure taxonomy: premature recognition,
  knowledge before explanation, object reset, impossible overlap,
  unrecorded cast entry.

## G5 Place camera geography (Place Registry)
- Place entries gain `cameraGeography` (defined wide/medium/detail
  positions, reverse-shot/eyeline rules) and clean-plate/layout
  reference asset types. Rule: crops and reverses are *views* of a
  setting, not new settings (no duplicate place entries).

## G6 Shot Recipe Library (per project)
- Project-level library of reusable **shot recipes** { shotId
  (SHOT_001…), purpose, framing/lens intent, movement, composition,
  lighting, durationIntent, exclusions } + spatial continuity fields
  (screen direction, eyelines, action axis, relative scale). Scenes
  may reference a recipe; a recipe never replaces the scene's own
  visual direction. Archetype defaults seed starter recipes.

## G7 Guide & standards enrichments
- Source DTO: `versionTranslationLimits` (version/translation limits
  of a source, e.g. scripture translations, editions).
- Verified Data entries: `methodologyNote` (calculation/adjustment
  method, e.g. "CPI-adjusted to 2024 dollars").
- Accessibility Annex adds: **safe area** for on-screen text and
  **colour-independent labels** (pattern/shape encoding, never
  colour alone); semantic colour code (red decline, green growth,
  blue neutral, gold premium) as a Finance/Data annex *default*.
- **Appearance departure log:** where a depiction departs from the
  sourced appearance, the departure + reason is recorded on the
  registry entry (creative choice ≠ sourced description).
- Bible §9: **per-character voice specs** keyed by character ID
  (delivery, timbre, pace, emotional range) for dialogue content;
  **voice-imitation boundary** — a proposed voice direction is not
  authorisation to imitate a living performer; voice references need
  consent/usage evidence recorded.
- Music cues: **silence** is an explicit recorded cue value, never
  an empty field mistaken for a missing cue.

## G8 External originality standard (Audit — Originality)
- Beyond the Do-Not-Repeat list: a bounded external comparison —
  scope recorded, works actually inspected listed (titles/URLs/
  dates), based on full content or transcripts (**search snippets
  never establish uniqueness**), inaccessible candidates and
  limitations kept visible in the report. Verdicts are per-run and
  never copied to other topics.

## G9 Coverage invariant & per-artifact readiness
- **Beat coverage invariant:** outline beats map to contiguous
  scene ranges; every scene is covered exactly once; each beat's
  claim set = the union of its scenes' claimIds. Checked at scene
  generation and in Audit (outline↔scene↔claim reconciliation).
- **Editorial Depth verdicts per deliverable:** Needs work / Ready
  as text / N/A with reason / Not reviewed — with worked failure/
  correction examples as completion evidence where a standard
  requires them, and the **prompt-smuggling check** (prompts must
  not introduce unplanned figures, objects, text or events).
- **N/A hardening:** N/A reasons must be substantive, and a
  **non-waivable core set** — identity, evidence, narration,
  delivery and review records — can never be marked N/A.

## G10 Package, handoff & publishing records
- **Clip accounting:** child clips keep the parent scene ID;
  child durations sum to the parent scene; each split records a
  join/handle plan. AI imagery is never labelled archival footage,
  a measured result or documentary evidence in the handoff.
- **Generator Profile record (per run):** selected tool/model/
  version, capabilities **verified** with date + official source
  (creative preferences recorded separately from verified limits),
  reference inputs in order, asset_method link. Companion to the
  library-level Output Format Profiles.
- **AssetItem:** + `checksum`; asset types include fonts and
  narrator/voice assets.
- **Viewer Glossary deliverable:** audience-facing glossary built
  per run from §10 entries actually used (sourced per run, never
  copied across subjects), linked from description/transcript.
- **Pinned comment** as a metadata deliverable (Step 17 / Package).
- **Corrections Log (per run, Step 15):** post-publication
  corrections — what was wrong, correction made, where announced;
  feeds Performance Learnings. Publication record fields stay
  **Pending** until real (never invent URLs or approvals).
- **Package history:** prior package versions are retained;
  the outdated fingerprint includes the toolchain/profile versions
  used, not only artifact versions.

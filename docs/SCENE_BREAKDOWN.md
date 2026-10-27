# Scene Breakdown v2 — Merged Design (2026-10-27)

Canonical Step 11 design. Merges our Scene system with the user's
MASTER_Phase3_SceneBreakdown.md (review: docs/SCENE_BREAKDOWN_REVIEW.md).
Scenes are **structured records** in the app; output formatting is
governed by **Output Format Profiles** (docs/OUTPUT_FORMAT_PROFILES.md)
— one rule set per target AI video/audio/image/edit tool, because each
tool accepts a specific script format. The source file's two
contradictory format rule sets both survive, as two different
profiles (plain-text VO vs structured editor sheet).

## 1. Scene record (superset template)

Identity & structure: sceneNo (sequential, no gaps), chapterId /
section, purpose (narrative function).
Narration: narration text (clean VO), speaker label (NARRATOR, or
character dialogue where dramatization is allowed), voWordCount,
estimatedVoSec, durationEstSec, retentionNote. (Canonical field
names per the API Scene DTO: per-scene estimates are
`estimatedVoSec` + `durationEstSec`; `estimatedDurationSec` is the
run/script-level total only — earlier drafts of this doc used
`estimatedVoSeconds` for the per-scene field, retired.)
Visual: visualDirection (specific, actionable — vague direction like
"make it dramatic" fails Audit), shotDescription, shotType /
cameraMove / animationNote (controlled vocabularies, archetype
defaults), footageRequirement, aiImagePrompt, aiVideoPrompt,
onScreenText, transition.
Registries (references, not free text): registryRefs
{ characters[], locations[], props[] } — locked descriptions come
from the registries; periodLabel (era/date).
Evidence & safety: **claimIds[]** (every factual scene cites Phase-1/
Research claim IDs; a factual scene with no claim fails Audit),
sourceRefs, **legalRiskFlag** (none | low | moderate | high —
moderate/high must be resolved or explicitly flagged unresolved).
Data: dataVizSpec? — the structured chart specification below (D4).

## Data Visualization — `dataVizSpec` schema (D4, resolved 2026-10-27)

A scene that directs a chart carries a **versioned `dataVizSpec`**
instead of a free-text "show a chart" instruction, so an editor can
build the chart without guessing:

```
dataVizSpec {
  schemaVersion,               // spec schema version (snapshotted per run)
  vocabularyVersion,           // chart-vocabulary version used (Admin)
  chartType,                   // from the Admin-managed vocabulary
  purpose,                     // what the chart must show/prove
  series[] { label, unit, values[] | points[], 
             sourceRef { kind: verifiedData | claim, id } },
  categoryLabels[]?,           // bar/column categories
  timePeriod?,                 // required for time-series types
  axis { xLabel, yLabel, scale: linear | log, min?, max?,
         startAtZero },        // bar/column: startAtZero must be true
                               // unless the annex records an override note
  sourceNote,                  // the on-chart source line (mandatory)
  accessibility { keyFindingText,   // text description of the key finding
                  contrastChecked: true },
  animationNote?, narrateAfterAnimation: true
}
```

**Chart-type vocabulary (seed v1 — Admin-managed, extensible):**
`bar`, `column`, `line`, `area`, `pie`, `scatter`, `timeline`,
`map`, `table`, `statCallout`. Each type declares its required
fields in Admin (e.g. `line`/`area` require `timePeriod` + time
series values; `pie` requires ≤ 6 slices whose values are parts of
one whole; `map` requires place refs). Admins add types through the
Annex Library with their required fields + validation rules
(§ Admin); the vocabulary is versioned, and **each run snapshots
the schema + vocabulary versions it used**, so later vocabulary
changes never alter a locked run's specs.

**Validation (server-side, at scene save + in Audit):**
- chartType must exist in the run's vocabulary version; required
  fields for that type must be present.
- **Every factual series must link** (`sourceRef`) to a Verified
  Data registry entry or a verified research claim of this run —
  unlinked or invented values fail validation. Missing evidence →
  the spec is flagged `missing_evidence` with the gap named.
- Scale rules are enforced (bar/column zero-baseline rule above;
  axis labels + units required; a `log` scale must be labelled on
  the chart in `sourceNote` or axis label).
- A scene whose dataVizSpec is missing required fields or fails a
  rule **cannot be marked complete** (Production Detail rules) —
  the gap list names exactly what to fix.
- **Unsupported visualization:** if the needed chart type is not
  in the vocabulary, the scene stores a `dataVizRequest
  { requestedType, description, status: draft }` instead of a spec,
  is flagged for Admin vocabulary review, and **cannot be marked
  complete** — it is never silently approximated with a wrong
  chart type.

**Worked examples:**
- *Valid:* column chart, "State-wise literacy rate (%)", one series
  linked to a Verified Data entry, categories = states, y-axis
  0–100 %, startAtZero true, sourceNote "Source: Census 2011,
  Table C-8", keyFindingText present → complete.
- *Missing evidence:* line chart of prices with a series whose
  sourceRef points to no claim/verified entry → `missing_evidence`,
  scene incomplete until the series is linked or removed.
- *Invalid scale:* bar chart with y-axis starting at 40 and no
  annex override note → validation error naming the zero-baseline
  rule.
- *Unsupported type:* a Sankey flow diagram requested before the
  vocabulary has one → `dataVizRequest` draft saved, scene flagged
  incomplete + Admin review queued; no substitute chart is
  generated.
Audio: sfx[] (max 3–4 per scene guidance), musicCue (the value
"silence" is an explicit cue, not an empty field).
Continuity (v2.1, docs/PHASE2_ADDITIONS.md G1): continuityState
{ startState, endState } — the next scene's start must match this
scene's end unless a stated transition explains the change;
referenceInputs[] (reference asset/registry versions the visuals
must match); editorialOverlayInstructions (exact text/graphics are
editing overlays — prompts never rely on generated lettering).
Optional: shotRecipeId referencing the project's Shot Recipe Library.
Notes: production notes.

**Locked (protected) fields:** registry refs, chapter, period —
sourced from Bible/registries; editing one inside a scene is not
allowed silently: it routes to a Bible/registry change and
regenerates affected scenes. Durations are estimates while drafting
and lock at scene-range approval.

## 2. Timing rules (narration-led)

- Scene duration derives from narration (Config v2: narration-led
  default; a fixed-seconds grid exists only as a project override).
- Narration pace: **140–160 WPM** (Bible §9 pacing). Word budget per
  scene = duration × WPM; ~18–20 words ≈ 8 seconds. Editor shows a
  per-scene budget indicator (under / near / over).
- Never plan narration above ~170 WPM; trim or extend/split instead.
- Data scenes: allow 3–5s for chart animation; narration names the
  key figure **after** the animation lands; on-screen text repeats
  the figure.
- Final 1–2 seconds of a scene: visual-only breathing room (no new
  dialogue starts).
- Per-content-type duration guidance ranges (data reveal, narrative
  beat, dialogue…) guide estimates in narration-led mode.

## 3. Audio hierarchy (Bible §9/§11 guidance)

Dialogue > Music > SFX. Dialogue normalised (-14 LUFS reference for
YouTube), music ducks under narration (~60–70%), SFX ~30–40%, spaced
away from critical narration, max 3–4 SFX per scene.

## 4. Generation ranges & continuity

- Scenes generate in **ranges of 25**. Project setting
  `sceneReviewMode`: `auto` (default — ranges run, safeguards
  checklist per range) or `first_range_review` (pause after scenes
  1–25 for approval, then auto).
- **Run Continuity Context** updated after each range: characters,
  locations, periods, facts used, deviations from locks — feeds
  later ranges and the Continuity audit. (Their MASTER_CONTEXT.md.)
- Production Safeguards run per range before scenes are presented:
  durations consistent with the run's duration mode, VO fits,
  protected fields match locks, claims cited, zero placeholders.

## 5. Package handoff notes

- **Clip splitting is a handoff concern:** if the production tool
  named in the AI Generation Handoff has a clip cap, the handoff
  splits a scene into clip-A / clip-B at a narrative break with a
  stitching note — scene design itself stays tool-agnostic.
- Clean VO export renders plain text; one VO file **per language**
  (project languages), speaker labels localised, timing/SFX/music
  references unchanged.

## 6. Relocated from the source file (not universal)

- The 100+ term glossary is finance/business → seed data for the
  **Finance niche Concept Registry + project Glossary**.
- ~10 finance-only mistakes (revenue≠profit, inflation adjustment,
  market-timing implications, cherry-picked data, stock-split
  annotation…) → **Finance Audit Add-ons** (Admin).
- Universal mistakes (unverified figures, missing sources,
  defamation, undisclosed sponsorship, speculation-as-fact,
  correlation≠causation, one-sided controversial claims, tone
  mismatch, duration/AV mismatch, safety-filter bypass) →
  platform Audit checks + generation prompt guidance.

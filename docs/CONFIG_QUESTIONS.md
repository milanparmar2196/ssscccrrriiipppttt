# Configuration Questions v2 — Improved & Niche-Wise (2026-10-27)

Source: user's `MASTER_Phase0_Config.md` (schema 5.0, Q1–Q42).
This set **replaces Q1–Q42 as the seed question library** for the
dynamic question system (API §6A). Legacy Q-numbers are preserved in
every mapping so existing CONFIG files remain interpretable.

## The conflicts in Q1–Q42 (found and resolved)

| # | Conflict | Resolution |
|---|---|---|
| C1 | **Comparisons asked twice:** Q12 Comparative Content and Q32 Comparative/Fairness Level — same decision, same default | Merged into ONE run question: `comparison_mode` |
| C2 | **Risk asked 4 times:** Q7 Content Sensitivity, Q10 Contested Facts, Q31 Controversial Content, Q41 Content Safety — overlapping scales that can contradict each other | Two clean questions only: project-level `safety_stance` (from Q7+Q41) and run-level `contested_handling` (from Q10+Q31) |
| C3 | **Accuracy asked 4 times:** Q8 Legal/Accuracy, Q23 Accuracy Priority, Q24 Source Quality, Q29 Verification Timeline | One project stance `accuracy_stance` (Q8+Q24); standards themselves live in Bible §13, not questions. Q29 removed (it's a process SLA, not content config) |
| C4 | **Q23 is broken:** "Accuracy Priority" has default *"Mixed audience"* — an audience value in an accuracy question | Deleted. Audience is Q2; accuracy is C3 |
| C5 | **Monetization asked 3 times:** Q13 Priority, Q35 Sponsored Content, Q36 Revenue Model | All three move to the Monetization Annex + project strategy (answered once per project, not per episode) |
| C6 | **Interviews asked twice:** Q6 Interview Segments + Q30 Expert/Access — and the platform is faceless with no interviews | Merged into ONE run question `source_voices`: quotes / expert sources / none (what the script may quote, not who is interviewed) |
| C7 | **Q40 Video Generation Method** conflicts with the platform's scope (script-only, no video generation) | Becomes `asset_method` in the Production Package handoff only: stock / AI-generated / mixed — a production instruction, not a script question |
| C8 | **Q3 default contradicts the Angle system:** Q3's default "Educational Explainer" is a format, but the user's own Angle Registry supplies Q3 (ANGLE_PLAN) | Q3 = `angle_id` selected from the niche's Angle Registry. No free-text default |
| C9 | **Q42 FIXED 8-second scenes** fight narration: scene length must follow VO words + pace (Bible §9 WPM), or audio and scenes desync | `scene_duration_strategy` default = **narration-led**; fixed-seconds becomes an explicit override (useful for Shorts) |
| C10 | **Q39 default "No warnings"** is unsafe: Ayurveda/medical/finance niches REQUIRE disclaimers | Disclaimer is **niche-driven** (from annex/registry policy), never a global "no warnings" default. Run question removed |
| C11 | **Q5 Visual/Media Priority ("Moderate")** is undefined — priority of what? | Dropped as a question. Its real intent (how visual-heavy) is the `visual_density` override in the Bible Visual section / archetype |
| C12 | **Ordering chaos + wrong level:** audience, money, legal, visual and cadence questions interleaved; Q2/Q25/Q26/Q28/Q37 are project/channel decisions asked per episode | Split into Layer A (project, once) and Layer B (run, per video) below |

Also kept from the source file (good rules): Q14 duration is stored as
exact seconds; Q15 (visual style) never determines production method;
angle scope is snapshotted into the run config; high legal/accuracy or
strict safety ⇒ human review gate before publication (kept — it maps
to our Audit gate + approval flow).

---

## Layer A — Project Questions (answered once per project)
(14 question labels below; two of them bundle two fields each, so
the seed/importer record count is **16 records** — counts in this
doc refer to labels unless stated.)
Stored as Project Config + Bible defaults; every Run inherits, a Run
may override only where marked. Grouped, in ask order:

**Audience & Language**
- A1 `audience` — Target audience (was Q2). Default: General Public
- A2 `audience_geo` — Geographic focus (was Q28). Default: Global
- A3 `language_primary` (was Q18) + `language_additional` (was Q19)

**Identity & Format**
- A4 `niche_id` + `sub_niche_id` — from the taxonomy (was Q1; never free text)
- A5 `platforms` — Distribution platforms (was Q26). Default: YouTube + Shorts/Reels
- A6 `series_strategy` — Series/playlist strategy (was Q37) → Bible §12

**Style Defaults** (seed the Bible; edited there afterwards)
- A7 `visual_archetype` + overrides (was Q15) → Bible §5
- A8 `voice_approach` — Voiceover/narration approach (was Q16) → Bible §9
- A9 `quality_level` — Production quality level (was Q27) → Package standard

**Stance & Safety** (project-level, runs cannot lower them)
- A10 `safety_stance` — Content safety/sensitivity stance (merged Q7+Q41). Strict ⇒ human review gate
- A11 `accuracy_stance` — Legal/accuracy concern + source quality floor (merged Q8+Q24). High/Critical ⇒ human review gate. Standards detail: Bible §13
- A12 `disclaimer_policy` — **set by niche** (annex/registry), not a free default (replaces Q39)

**Business**
- A13 `monetization` — Priority + revenue model + sponsorship (merged Q13+Q35+Q36) → Monetization Annex
- A14 `cadence` — Publishing/update frequency (was Q25) — project planning only

## Layer B — Run Questions (per video, in pipeline order)
(18 question labels below = **20 seed/importer records**, same
bundling note as Layer A.)
Asked at Run creation / Topic & Outline steps. Grouped:

**Focus**
- B1 `angle_id` — Angle from the niche's Angle Registry (was Q3) + the run's concrete `story_question` (required, per user's rule)
- B2 `subject_focus` — Topic-driven / person-driven / event-driven / comparison-driven (was Q9)
- B3 `depth_level` — Content depth (was Q4): Surface overview / Moderate / Deep dive / Academic/expert (canonical wording — the expanded-options list below)
- B4 `expertise_level` — Expertise the script may assume/use (was Q11)

**Content Choices**
- B5 `comparison_mode` — No comparisons / compare within subject / compare across subjects (merged Q12+Q32)
- B6 `contested_handling` — Exclude contested claims / include with all major sides / include flagged-as-disputed (merged Q10+Q31)
- B7 `recency_mode` — Historical only / include recent developments / current-events led (was Q33)
- B8 `source_voices` — Quotes only / expert sources cited / no external voices (merged Q6+Q30)

**Shape**
- B9 `structure_template` + `hook_type` — **NEW** (from Bible §6 templates + Hook Library; the old set never asked, so structure was decided ad hoc)
- B10 `duration_target_seconds` — exact seconds stored (was Q14); asked as minutes + tolerance in UI
- B11 `delivery_format` — Single video / multi-part (was Q17)
- B12 `ending_tone` — (was Q22). Default: Reflective/Thoughtful
- B13 `video_format` — **NEW**: Long-form / Short / both-cuts (drives structure, hook and scene strategy; the old set implied it only via Q42)

**Visual & Text** (defaults from Bible Visual section + archetype)
- B14 `onscreen_text_strategy` (was Q20)
- B15 `graphics_requirement` (was Q21): None / Light / Important / Data-led (data-led activates the Data Visualization Annex rules)
- B16 `scene_duration_strategy` (was Q42): **Narration-led (default)** / Fixed seconds (override, value required)

**Publishing**
- B17 `seo_focus` — Keyword priority (was Q38). Default: specific topic/subject names
- B18 `asset_method` — handoff only (was Q40): Stock / AI-generated / Mixed. Appears in the Production Package, never in script generation

**Removed entirely:** Q5 (undefined, → visual_density override),
Q23 (broken), Q29 (process SLA, not config), Q34 Bias Prevention
Strategy (it's a *policy* — lives in Bible §8 + §13 and the Bias Audit
checklist; a run inherits it, it is not re-answered per episode).

## Niche-Wise Question Packs (assigned per niche, like all questions)
Shown only for niches in that category — via the existing
Assign/Clone mechanism in the Question Library. Seed packs:
> **Note (B-sweep 2026-10-27):** this section is the original
> summary sketch. The packs were later FULLY DEFINED (12 packs, 29
> questions) in **docs/question_packs_seed.json** (v2.2), which is
> canonical — where a key or option here differs from the seed
> (e.g. the early `tutorial_vs_explainer` sketch), the seed wins.

- **History / Documentary:** `dramatization_allowed` (invented
  dialogue: never / labelled-only), `era_strictness`, `map_usage`
- **Ayurveda / Health / Medical:** `disclaimer_variant` (from annex),
  `remedy_content` (allowed? framing), `medical_review_required`
- **Finance / Business:** `data_period` (figures as-of), `advice_boundary`
  (education-only confirm), `verified_data_only` (figures only from the
  Verified Data Registry + Research Brief)
- **Crime / Mystery:** `case_status` (solved / cold / ongoing-legal-care),
  `victim_sensitivity` (naming/imagery rules), `graphic_detail_level`
- **Religion / Devotional:** `representation_mode` (traditional /
  cinematic / both-labelled), `belief_labelling` (required where applicable)
- **Kids / Family:** `age_band`, `reading_level`, `lesson_explicitness`
- **Science / Space:** `diagram_density`, `math_level`, `speculation_labelling`
  (for unsolved/speculative topics)
- **Future / Speculative:** `speculation_label_style` (mandatory labelling format)
- **Stories / Fiction:** `dialogue_format` (narration-only / dialogue
  script — the Package format from Bible file 11), `cliffhanger_ending`
- **Sports:** `data_recency` (historic / current season), `stats_density`
- **Geography:** `disputed_region_handling` (neutral naming confirm),
  `map_style`
- **Tech / AI:** `tutorial_vs_explainer`, `tool_version` (tutorials pin
  the tool/UI version they describe)

## Fit with the platform
- All questions are `ConfigQuestion` records (Admin Question Builder):
  Layer A = scope `project`, Layer B = scope `run`, packs = scope
  `niche`/`category` assignments. Keys above are the canonical keys;
  legacy Q-numbers are stored as `legacyId` for migration.
- The Project wizard asks Layer A (grouped as above); Run creation
  asks Layer B in pipeline order; nothing is asked twice anywhere.
- Answers snapshot into the Run exactly as before; Bible sections
  remain the locked source for style/standards — questions seed and
  override, they never replace the Bible.

## Niche-Wise Question Packs — Full Definitions (added 2026-10-27)

Machine-readable seed: `docs/question_packs_seed.json` (Admin Question
Library import format — same ConfigQuestion shape as Layer A/B).
29 questions in 12 packs; each pack is Assigned to its category's niches.

### History & Documentary Pack — applies to: History & Heritage
- `dramatization_allowed` — May the script invent dialogue or scenes for real people? | single_choice | Never / Only if labelled as dramatization / Freely | default: labelled_only | required: True | mapsTo: bible.annexes.character.dialoguePolicy
- `era_strictness` — How strict is period accuracy (clothes, objects, language)? | single_choice | Strict period accuracy / Balanced / Cinematic liberty | default: strict_period | required: True | mapsTo: run.config.eraStrictness
- `map_usage` — How much should maps be used? | single_choice | None / Occasional / Frequently | default: occasional | required: False | mapsTo: run.config.mapUsage

### Ayurveda, Health & Medical Pack — applies to: Health, Wellness & Ayurveda
- `disclaimer_variant` — Which disclaimer applies to this content? | single_choice | Standard medical information disclaimer / Ayurveda traditional-use disclaimer / Condition awareness disclaimer | default: standard_medical | required: True | mapsTo: package.disclaimer
- `remedy_content` — May remedies/practices be presented, and how? | single_choice | No remedies / Only framed as traditional use / General wellness only | default: traditional_use_framed | required: True | mapsTo: run.config.remedyContent
- `medical_review_required` — Must this run pass human medical review before approval? | yes_no | yes_no | default: True | required: False | mapsTo: run.gates.medicalReview

### Finance & Business Pack — applies to: Finance, Business & Economics
- `data_period` — Figures should be as of which period? | single_choice | Latest available / Latest quarter / Latest full year | default: latest | required: True | mapsTo: run.config.dataPeriod
- `advice_boundary` — Advice boundary for this content | single_choice | Education only — no personal advice / Education with advice-style examples + disclaimers | default: education_only | required: True | mapsTo: bible.compliance.adviceBoundary
- `verified_data_only` — May the script state figures only from the Verified Data Registry + Research Brief? | yes_no | yes_no | default: True | required: False | mapsTo: run.config.verifiedDataOnly

### Crime & Mystery Pack — applies to: Crime, Mystery & Investigations
- `case_status` — Status of the case(s) covered | single_choice | Solved / closed / Cold / unsolved / Ongoing — legal care required | default: solved | required: True | mapsTo: run.config.caseStatus
- `victim_sensitivity` — How are victims and families treated? | single_choice | Strict — no victim names/images beyond necessity / Names from public record only / Standard | default: public_record | required: True | mapsTo: bible.compliance.victimSensitivity
- `graphic_detail_level` — How much graphic detail is allowed? | single_choice | None / Implied only / Moderate, non-graphic description | default: implied | required: True | mapsTo: run.config.graphicDetailLevel

### Religion & Devotional Pack — applies to: Religion, Philosophy & Spirituality
- `representation_mode` — How are sacred subjects represented? | single_choice | Traditional / scriptural representation / Cinematic interpretation / Both, clearly labelled | default: traditional | required: True | mapsTo: bible.annexes.subject.representationMode
- `belief_labelling` — Must belief-based content be labelled as belief (not verified fact)? | yes_no | yes_no | default: True | required: False | mapsTo: run.config.beliefLabelling

### Kids & Family Pack — applies to: Kids, Family & Parenting
- `age_band` — Target age band | single_choice | 3–5 years / 6–8 years / 9–12 years / All-family | default: 6_8 | required: True | mapsTo: project.config.ageBand
- `reading_level` — Language and reading level | single_choice | Very simple / Simple / Moderate | default: simple | required: True | mapsTo: run.config.readingLevel
- `lesson_explicitness` — How explicit is the lesson/moral? | single_choice | Stated moral at the end / Implied by the story / No lesson — pure story | default: explicit_moral | required: False | mapsTo: run.config.lessonExplicitness

### Science & Space Pack — applies to: Science, Space & Earth
- `diagram_density` — How diagram-heavy should scenes be? | single_choice | Low / Moderate / High | default: moderate | required: False | mapsTo: run.config.diagramDensity
- `math_level` — Highest maths the script may use | single_choice | None / Basic / Intermediate / Advanced | default: basic | required: False | mapsTo: run.config.mathLevel
- `speculation_labelling` — Must unsolved/speculative claims be labelled as such? | yes_no | yes_no | default: True | required: False | mapsTo: run.config.speculationLabelling

### Future & Speculative Pack — applies to: Future & Speculative Civilization
- `speculation_label_style` — How is speculation labelled? | single_choice | Opening disclaimer / Persistent on-screen label / Both | default: both | required: True | mapsTo: bible.compliance.speculationLabelStyle

### Stories & Fiction Pack — applies to: Stories, Fiction & Fantasy Worlds
- `dialogue_format` — Script format for this story | single_choice | Narration only / Dialogue script (Package dialogue format) | default: narration_only | required: True | mapsTo: package.format.dialogue
- `cliffhanger_ending` — End on a cliffhanger (series stories)? | yes_no | yes_no | default: False | required: False | mapsTo: run.config.cliffhangerEnding

### Sports Pack — applies to: Sports, Games & Play
- `data_recency` — How recent is the data focus? | single_choice | Historic / Recent season / Current / live season | default: historic | required: False | mapsTo: run.config.dataRecency
- `stats_density` — How stats-heavy should the script be? | single_choice | Light / Moderate / Heavy | default: moderate | required: False | mapsTo: run.config.statsDensity

### Geography Pack — applies to: Geography, Places & Maps
- `disputed_region_handling` — How are disputed places/borders handled? | single_choice | Neutral naming (locked rule) / Avoid disputed areas | default: neutral_naming | required: True | mapsTo: bible.annexes.placeRegion.namingRule
- `map_style` — Default map style | single_choice | Standard political / Physical / terrain / Minimal outline | default: standard_political | required: False | mapsTo: bible.visual.mapStyle

### Technology & AI Pack — applies to: Technology, AI & Digital Life
- `content_mode` — Content mode | single_choice | Explainer / Tutorial / News / analysis | default: explainer | required: True | mapsTo: run.config.contentMode
- `tool_version` — Tool / UI version this tutorial describes | short_text | short_text | default: None | required: False | mapsTo: run.config.toolVersion · shown when content_mode = tutorial

## Custom Answers & Expanded Options (added 2026-10-27)

**Rule: no question is a closed box.** The listed options are starting
points, never the limit of what a creator can answer.

### 1. Custom answers on every choice question
- Every `single_choice` / `multi_choice` question has
  `allowCustomAnswer: true` (Admin can switch it off per question only
  where a locked system value is truly required, e.g. disclaimer
  variants may be strengthened but not replaced by free text where law
  or platform policy fixes the wording — those questions say so).
- The form always shows **"Other — write your own"** with a text field.
- Storage: the answer is saved as `{ value: "custom", customText }`
  next to the question key and schema version, and snapshots into the
  Run exactly like a listed answer — finished videos stay reproducible.
- A custom answer that feeds a **locked Bible field** (e.g. a custom
  dialogue policy) becomes a *proposal*: it takes effect when the
  Bible version is approved, never silently. Custom answers to
  run-level questions apply to that run immediately.
- **Save as my preset:** a user can save a custom answer as a personal
  preset and reuse it across their projects (same personal-scope idea
  as personal Niche Templates). Admin can also promote frequently used
  custom answers into the shared option list — that's how the lists
  keep growing (fully dynamic).

### 2. Expanded option lists (seed v2.2)
Thin lists from v2 expanded — Admin can still add more at any time:

- `voice_approach` (A8): Engaging Storytelling · Calm Documentary ·
  Authoritative · Conversational · Energetic · Dramatic · Warm/Personal
- `ending_tone` (B12): Reflective/Thoughtful · Inspirational ·
  Curious (open loop for next episode) · Urgent/Alerting · Calm ·
  Celebratory · Somber · Hopeful
- `platforms` (A5): YouTube Long-form · YouTube Shorts · Instagram
  Reels · TikTok · Facebook · Multi-platform (one master, cut versions)
- `series_strategy` (A6): Standalone videos · Themed playlist ·
  Numbered series · Seasonal arcs · Evergreen library (no order needed)
- `quality_level` (A9): Standard · Premium · Cinematic
- `cadence` (A14): Daily · 3× per week · Weekly · Twice monthly ·
  Monthly · As-needed
- `delivery_format` (B11): Single video · Two-part · Series episode
  (delivery STRUCTURE only — Long-form/Short/both-cuts lives in
  B13 `video_format`; the two are separate dimensions and must not
  be merged)
- `onscreen_text_strategy` (B14): None · Minimal (keywords only) ·
  Moderate · Heavy (data/labels) · Full subtitles focus
- `graphics_requirement` (B15): None · Light · Important · Data-led ·
  Animation-led
- `depth_level` (B3): Surface overview · Moderate · Deep dive ·
  Academic/expert
- `subject_focus` (B2): Topic-driven · Person-driven · Event-driven ·
  Place-driven · Comparison-driven · Question-driven
- `seo_focus` (B17): Specific topic names · Question phrases ("how /
  why") · Trending terms · Long-tail phrases · Entity names (people/places)
- Pack questions keep their v2.1 options + custom answers enabled
  (seed JSON updated to v2.2: 23 choice questions with
  `allowCustomAnswer`).

### 3. Validation for custom answers
Length limits per question (Admin-set, generous by default), no
empty custom text when "Other" is chosen, and number-typed questions
still require a number — custom applies to choice questions, not to
free numeric/text fields (those are already free by nature).

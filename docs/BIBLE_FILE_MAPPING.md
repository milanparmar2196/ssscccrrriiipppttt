# Production Bible File Mapping — 39 User Files → Layered Bible (2026-10-27)

The user's `Production_Bible_File_List.md` listed 39 files in one flat
list — rules, guides, registries, templates, checklists, logs and
per-video artifacts mixed together, with duplicate pairs. This mapping
gives every file **one proper home** in the layered system:

**Layers:** Bible Sections (§1–14) · Annexes · Registries · Master
Lists · Templates · Audit & Checklists (Step 12/14 instruments) ·
Run & Package Artifacts (per-video, NOT Bible) · Platform Docs.

## The mapping (all 39)

| # | User file | Layer → Destination |
|---|---|---|
| 00 | Project_Consistency_Rules | **Bible Governance** — the Bible's own consistency/versioning rules + §12 Series & Continuity. Becomes the Bible Preface every project Bible carries |
| 01 | Research_Sources | **Master List 1** — Master Source List (approved/blocked sources) |
| 02 | Financial_Data_Verified | **Registry (NEW)** — Verified Data Registry, see Adoptions |
| 03 | Accuracy_Verification_Checklist | **Audit** — Accuracy/Fact checklist instrument, Step 12 |
| 04 | Visual_Style_Guide | **Bible §5 Visual** — now the Visual Archetype system (docs/VISUAL_STYLE_SYSTEM.md) |
| 05 | Voiceover_Guide | **Bible §9 Voice & Narration** |
| 06 | Data_Visualization_Specs | **Annex (NEW)** — Data Visualization Annex, see Adoptions |
| 07 | YouTube_Strategy | **Project Strategy + Bible §1/§7** — channel strategy lives at project level; packaging rules in §7; execution in Step 17 |
| 08 | Legal_Liability_Guide | **Bible §8 Compliance & Avoid** (legal part) |
| 09 | Ethical_Storytelling_Guide | **Bible §8 Compliance** (ethics part) + registry sensitivity rules (crime, devotional, kids) |
| 10 | Scene_Template | **Template** — Scene Template in Niche Templates (scene object standard) |
| 11 | Dialogue_Script | **Run Artifact (format)** — dialogue-format script output for story niches; a Production Package format option, not Bible |
| 12 | Monetization_Strategy | **Annex** — Monetization & Sponsor Annex |
| 13 | Source_Credibility_Guide | **MERGED → 01 + §13** — credibility tiers live in §13 Research & Evidence Standards (source hierarchy) and as the `tier` on Source List entries. Duplicate resolved |
| 14 | Bias_Prevention_Checklist | **Audit** — Bias & Neutrality checklist, Step 12 (feeds geopolitics/religion neutrality rules in §8) |
| 15 | Project_Summary | **Platform Artifact** — auto-generated Project Home summary (dashboard), not Bible content |
| 17 | AI_GENERATION_HANDOFF | **Package Artifact** — the Production Package's handoff brief: instructions + prompts for external AI image/video/voice tools (the platform generates scripts only; this file is how production tools receive the work) |
| 18 | ASSET_REGISTER | **Master List 7 + Run log** — Approved Asset Source List (sources) in the Bible; the per-project Asset Register (assets actually used, with licence) is generated per Run in the Package |
| 19 | CAMERA_ANIMATION_GUIDE | **Standard (ADOPTED)** — Camera & Animation Direction standard for scenes, see Adoptions |
| 20 | CHARACTER_APPEARANCE_LOCK | **Registry** — `lockedAppearanceDescription` field of the Character Registry |
| 21 | CHARACTER_WORLD_GUIDE | **Registry + Annex rules** — Story-World Registry entries + Character Annex portrayal/world rules |
| 22 | DELIVERY_CHECKLIST | **Checklist** — Production Package delivery gate checklist, Step 14 |
| 23 | EDITORIAL_DEPTH_REVIEW_TEMPLATE | **Audit (ADOPTED)** — Editorial Depth Review, a Step 12 audit dimension + Admin template, see Adoptions |
| 24 | GENERATOR_PROFILE_TEMPLATE | **Template** — **Project Generation Profile**: per-project generation settings (per-step prompt/model profile selection) used at Run creation. NOT the same as the per-run **Generator Profile** record (the snapshot of models/tools a run actually used, G10 — that lives in the Package/manifest); the two are named distinctly everywhere since the B-sweep |
| 25 | LOCATIONS_ENVIRONMENTS | **Registry + Master List** — Place Registry entries + Master Location/Setting List |
| 26 | MAIN_CHARACTERS | **Registry** — Character Registry, `role: main` |
| 27 | MASTER_Phase2_ProductionBible | **The Bible itself** — their "Phase 2" master document = our Production Bible (workflow Step 8 output); not a separate file |
| 28 | MUSIC_SOUND_GUIDE | **Bible §11 Music & Sound** |
| 29 | ORIGINALITY_REVIEW | **Audit** — Originality Audit dimension, Step 12, powered by the Do-Not-Repeat List |
| 30 | PRODUCTION_DETAIL_STANDARD | **Standard (ADOPTED)** — Production Detail Standard: minimum detail every scene must carry, see Adoptions |
| 31 | PROPS_COSTUMES | **Registry (NEW)** — Props & Wardrobe Registry (Registry Type 11), see Adoptions |
| 32 | RELATIONSHIPS_TIMELINE | **Registry** — Character Registry `relationships[]` + character life timeline + Master Timeline List |
| 33 | REVIEW_REVISION_LOG | **Run Artifact** — per-Run revision log (Step 13); its template lives in Admin audit/workflow templates |
| 34 | STORY_BEAT_MAP | **Template** — beat-map templates inside Structure Templates (Niche Templates) |
| 35 | SUPPORTING_CHARACTERS | **Registry** — Character Registry, `role: supporting` |
| 36 | VIEWER_GLOSSARY | **Bible §10 Glossary** — the project's glossary; a viewer-facing extract ships in the Package (description/pinned material) |
| 37 | Visual_Style_Quick_Reference | **MERGED → 04** — not a separate file: it is the one-card *view* of the archetype (the Web app's Archetype Card). Duplicate resolved |
| 38 | WORKFLOW_GUIDE | **Platform Doc** — the master workflow (docs/WORKFLOW.md), governs the platform, not a project Bible |
| 39 | YOUTUBE_METADATA | **Package + Step 17** — per-video metadata template (title/description/tags) in the Package; strategy part already in 07 |

**Result:** 39 flat files → 0 lost. 2 duplicates merged (13→01/§13,
37→04), 5 files recognised as not-Bible (11, 15, 27, 33, 38 — they
live as run artifacts, platform docs, or the Bible itself), everything
else in exactly one layer.

---

## Adoptions — new components this list contributed (defined)

**1. Data Visualization Annex** (niche-dependent annex; data-heavy
niches: finance, science, statistics, geography, business)
Chart-type selection rules per data kind, axis honesty rules (no
truncated axes that mislead), label and unit standards, number
formatting (Indian/international per audience), colour-blind-safe
palette note, source line mandatory on every chart. Used by Script
(data scenes) + Scene Breakdown + Accuracy Audit.

**2. Verified Data Registry** (Knowledge-registry variant; finance,
economics, statistics, health-data niches)
Entry: `{ metric, value, unit, period, geography, sourceRef,
verifiedOn, reviewBy, notes }`. Scripts may only state figures that
exist here or in the Run's Research Brief — this is the project's
standing, pre-verified numbers bank (per-video facts still go through
the Research Brief fact lock).

**3. Props & Wardrobe Registry — Registry Type 11** (story, history,
fiction, devotional niches)
Entry: `{ name, type: prop|wardrobe, ownerRef (character/place),
era, lockedDescription, imagePromptSuffix, continuityNotes }`. A
king's crown, a detective's notebook, a deity's attributes must look
identical in every scene — same locked-description mechanism as
characters. Used by Scene Breakdown + Continuity Audit.

**4. Camera & Animation Direction Standard** (scene-level)
Controlled vocabulary added to the Scene object: `shotType`
(establishing / wide / medium / close / macro / aerial / screen /
diagram), `cameraMove` (static / slow push-in / pan / tracking /
parallax / orbit / handheld), `animationNote` (what moves, in what
order, for AI-video production). Per-archetype defaults come from the
Visual Style System; scenes may override. This is text direction —
the platform still produces no video.

**5. Editorial Depth Review + Production Detail Standard** (QC)
- Editorial Depth Review (Step 12 dimension): does the script actually
  *answer* its angle question with depth — evidence used, comparisons
  made, counterpoints handled — or is it surface-level? Scored with a
  template in Admin (per-niche add-ons allowed).
- Production Detail Standard (scene completeness): every scene must
  carry narration, visual, shot/camera direction, on-screen text
  decision, duration estimate, and registry references where an entity
  appears. The Audit's completeness check enforces it; a scene
  missing a field cannot pass.

## Spec impact
- API: Registry types gain `propsWardrobe`; Knowledge registry gains
  the Verified Data variant; annex library gains `dataVisualization`;
  Scene DTO gains shotType/cameraMove/animationNote; Audit gains the
  Editorial Depth dimension + Production Detail completeness check.
- Admin: annex templates (+ Data Visualization), audit templates
  seeded from user files 03/14/23/29 (Accuracy, Bias, Editorial
  Depth, Originality) as the default Step 12 checklist set.
- Web: Scene Editor shows the three direction fields with the
  controlled vocabularies; Bible Registries tab shows the new types
  when active.
- Shared: DTO updates as above.

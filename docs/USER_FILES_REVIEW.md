# Review of User's 4 Shared Files (2026-10-27)

> **Status (2026-10-27): REVIEW COMPLETE — the adopted items from this review are integrated into the specs/docs named inside; rejected items and their reasons are recorded here. This file is the review record, not a live spec.**

User shared these as incomplete / not proper, to be improved as per
requirement. Source files in `~/workspace/user/files/`.

## 1. Niche_Names_Only.txt — 550 niches, flat numbered list (001–550)
- Strength: huge coverage, India-specific depth (Sanatan, Ramayana,
  Mahabharata, Indian Geography/Cities, Ayurveda), future-tech block
  (467–492), public-interest block (493–550).
- Problems: FLAT — no categories, no sub-niche level. Mixed levels:
  true niches next to sub-niches and single topics (Mantra, Credit
  Cards, Clouds & Atmosphere, Ramayana/Mahabharata are topics/sub of
  mythology). Semantic duplicates: 009 Psychology/Human Behavior vs
  171 Human Behavior; 077 Yoga & Wellness vs 280 Yoga; 318 Internet
  vs 129 Internet History; 085 DIY & Making vs 399 DIY. Some entries
  are FORMATS not niches (090 "Why? Channel", 088 How It's Made).
  Species-level items (Insects, Birds, Reptiles) sit beside broad
  niches (Wildlife & Animals).
- Fix: reorganise into Category → Niche → Sub-Niche (Section 51 shape),
  demote topics to sub-niche/topic-seed level, merge semantic dupes,
  tag Entity Focus per niche. KEEP original numbers as legacy IDs —
  user's existing registry uses them (Angle doc cites niche ID 530
  Media Literacy = line 530 here).

## 2. VISUAL_STYLE_MASTER_DATABASE___500.txt — claims 500 profiles, file has 34 rows
- Strength: real archetype system underneath (~13 archetypes in the
  34 rows: Cinematic Historical Documentary, Sacred Cinematic
  Devotional, Scientific Cinematic Explainer, Premium Business
  Editorial, Dark Mystery, Engineering Cinema, etc.), rich per-row
  fields: palette, lighting, camera/lens, thumbnail direction, AI
  prompt keywords, Avoid list. Global production rules are good.
- Problems: only rows 1–34 present (466 claimed rows missing; 517 of
  the 550 niches uncovered). ID 5 name mismatch: "Business
  Storytelling" here vs "Documentary Storytelling" in niche list.
  Schema promises Texture + Graphics columns; table drops them.
  Motion column is copy-paste identical in nearly all rows. Wrong
  archetype example: 017 Kids Cartoon Stories → "High-Impact
  Engineering Cinema". Built on a master file NOT shared:
  YOUTUBE_NICHE_MASTER_DATABASE_500.md (500 niches, 7,500 content
  directions = 15 angles/niche) — request it.
- Fix: archetype-first rebuild — define ~14–20 archetypes fully ONCE,
  then niche → archetype mapping + per-niche overrides for all niches.
  No 500 duplicated rows to maintain.

## 3. Production_Bible_File_List.md — 39 file names only (no contents)
- Strength: covers things our Bible lacks or underplays:
  02_Financial_Data_Verified, 06_Data_Visualization_Specs,
  19_Camera_Animation_Guide, 31_Props_Costumes,
  18_ASSET_REGISTER, 23_EDITORIAL_DEPTH_REVIEW,
  29_ORIGINALITY_REVIEW, 33_REVIEW_REVISION_LOG.
- Problems: FLAT and mixed-kind: rules, guides, registries, templates,
  checklists, logs and per-video artifacts (Dialogue_Script) all in
  one undifferentiated list. Overlaps: 01_Research_Sources vs
  13_Source_Credibility_Guide; 04_Visual_Style_Guide vs
  37_Visual_Style_Quick_Reference; 07_YouTube_Strategy vs
  39_YouTube_Metadata. Naming inconsistent (numbered vs UPPER_SNAKE
  vs Title_Case). No per-niche applicability (which niches need the
  Financial file?), no versioning/locking.
- Fix: map all 39 into our layered Bible (Sections / Annexes / Master
  Lists / Templates / Checklists) with a mapping table, merge the
  duplicate pairs, adopt their unique files as new Bible items:
  Data Visualization Specs, Financial Data (finance registry),
  Props & Costumes Registry, Camera & Animation Guide, Asset Register.

## 4. Angle_s_scope.txt — documentation of user's EXISTING registry system
- Reveals user already runs a local registry system:
  REGISTRY/Niches/<ID>_<Slug>/ANGLE_PLAN.json per niche; each angle =
  { slug, angle, question, scope, evidence, boundary }; Angles/*.md
  generated views; Phase 0 CONFIG.md with Q1–Q42 config questions
  (angle label supplies Q3); Phase 1 Research_Summary.md +
  Claim_Ledger.md; scope-audit tooling (populate/review scripts).
- This is GOOD design and our SaaS specs lack it: adopt **Angle as a
  first-class object** — Niche → Angles (question/scope/evidence/
  boundary) → episode/run picks angle + story question; scope becomes
  the run's research boundary; audit checks script stayed in scope.
  Compatible with our dynamic questions (their Q1–Q42 become question
  set content) and our claim→source rule (Claim_Ledger).
- Missing: the ANGLE_PLAN data itself (only doc + one example: niche
  530 Media Literacy, Teaching Transfer angle). Request the registry
  export if it exists.

## Improvement order (proposed)
1. Merge niche lists (their 550 + our Section 51) → final hierarchy
   with legacy IDs + entity focus.
2. Build Registry Map from merged niches (per earlier plan), now
   including Angle registry per niche.
3. Rebuild visual styles archetype-first, full niche coverage.
4. Restructure the 39 Bible files into the layered Bible + adopt
   their unique items (Data Viz, Props & Costumes, Asset Register…).
5. Reflect all of it in specs + Notion (user's standing flow).

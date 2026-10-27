# Review — MASTER_Phase3_SceneBreakdown.md (user file, 2026-10-27)

> **Status (2026-10-27): REVIEW COMPLETE — the adopted items from this review are integrated into the specs/docs named inside; rejected items and their reasons are recorded here. This file is the review record, not a live spec.**

Their Phase 3 = our Step 11 Scene Breakdown (Phase 1 Research Bible =
our Research Brief, Phase 2 Production Bible = our Bible). The file is
strong production craft, but written for ONE channel type (business/
finance stories — Kodak example, finance glossary, finance mistakes).

## Adopt (improves our system)
1. **Claim IDs per scene** — every factual scene cites Claim_Ledger
   IDs. Upgrade for us: Scene gains `claimIds[]` + per-scene source
   refs + `legalRiskFlag` (none/low/moderate/high). Enforces our
   claim→source rule at scene level, not just research level.
2. **Registry refs, not free text** — their Location/Characters/Period
   fields become references to Place/Character Registry entries (+
   chapter/section, time/period) in our Scene DTO.
3. **Data Viz spec block per scene** (chart type, data, source,
   animation) — instance-level companion to the Data Viz Annex rules.
4. **Production Safeguards Checklist** → enriches Step 12 Audit +
   Production Detail Standard: zero placeholders, names spelled per
   locks, VO duration fits scene, data viz completeness, disclaimer
   present where required.
5. **Timing & audio craft (their troubleshooting)** — WPM math
   (140–160 WPM; ~18–20 words per 8s), narration word budget per
   scene, chart-sync rule (narrate the number AFTER the chart
   animates; 3–5s animation allowance), audio hierarchy Dialogue >
   Music > SFX (-14 LUFS, ducking, max 3–4 SFX/scene, final 1–2s
   visual-only breathing room) → Bible §9/§11 guidance + scene
   validation warnings.
6. **25-scene generation ranges + MASTER_CONTEXT** — generation in
   ranges of 25 scenes; a Run Continuity Context (characters,
   locations, facts, deviations) updated per range; first-range
   review as an optional Generator Profile setting (interactive vs
   autonomous mode), not a hard gate.
7. **Protected/locked scene fields** — fields sourced from Bible/
   registries can't be silently edited inside a scene; changing one
   routes to a Bible change + regenerate affected scenes (after
   scene approval; durations are estimates until then).
8. **Multi-language VO scripts** — one clean VO file per additional
   language in the Package, localised speaker labels (already
   matches our A3 languages + Package design).
9. **Vague-vs-Specific examples** → scene-generation prompt guidance
   + Audit specificity check ("show something dramatic" fails).

## Conflicts / problems (with resolutions)
- K1 **FIXED 8-second scene formula as default** (scene count =
  runtime ÷ 8) — conflicts with the resolved narration-led default
  (Config C9) and with the file's own Mistake 28 / Problem 6 (VO
  overflow). The 8s grid is a *tool* constraint (Veo3 clip cap), and
  we're tool-agnostic: keep scenes narration-led with per-content-
  type duration guidance; clip-splitting (their clip-A/clip-B +
  stitching note) moves to the AI Generation Handoff in the Package.
- K2 **Formatting self-contradiction:** the checklist demands plain
  text, no bold, no `---`, exactly 3 blank lines between scenes —
  while the Formatting Rules demand `---` separators, 2 blank lines,
  and the template itself is bold markdown. Dissolved in our model:
  scenes are structured records; formatting is an *export render*
  (Clean VO export = plain-text rules; app view = structured).
- K3 **Finance bias presented as universal:** the 100+ term glossary
  is all finance/business → relocate as seed data for the Finance
  niche's Concept Registry + Glossary. ~10 of the 29 mistakes are
  finance-only (revenue≠profit, inflation adjustment, market timing,
  cherry-picked data) → Finance niche Audit Add-ons; the universal
  ones (unverified figures, no source, defamation, undisclosed
  sponsorship, speculation-as-fact, correlation≠causation, tone
  mismatch, duration/AV mismatch) → platform Audit + prompt guidance.
- K4 File references (04_Locations, Facts_Documented, Source_List…)
  are already covered by our registries/lists (Bible mapping §55).
- K5 "ARCHIVE INTERVIEW" speaker labels — faceless + script-only:
  interviews exist as quoted narration per `source_voices`; speaker
  labels = NARRATOR + character dialogue where dramatization allows.
- K6 Autonomous completion vs approvals — resolved via Generator
  Profile review-mode setting (see Adopt 6); Audit + final approval
  gates unchanged.
- K7 Their template lacks our AI Image/Video Prompt + On-Screen Text
  + Purpose fields; ours lacked their Claim IDs / Legal Flag / Data
  Viz block. **Merged template = superset of both.**
- K8 Duration as a pre-locked protected field conflicts with
  narration-led drafting — durations lock at scene-range approval,
  not before writing.
- K9 Their Phase 4 mentions (compile/Package_Inputs) match our
  Production Package design; no change.

## Integration plan (on approval)
1. Shared/API: Scene DTO v2 = current fields + claimIds[], sourceRefs,
   legalRiskFlag, registryRefs{characters[], locations[], props[]},
   chapterId, periodLabel, dataVizSpec?, voWordCount + estimatedVoSeconds.
2. Web §8 Scene Editor: new fields + word-budget indicator per scene
   (words vs WPM duration, chart-sync note field), range generation
   (25s) + Run Continuity Context panel.
3. Audit: safeguards items added (placeholders, lock-spelling, VO fit,
   data viz completeness, specificity) + finance add-on pack from the
   finance mistakes; glossary relocated to Finance Concept Registry seed.
4. Bible §9/§11: timing & audio hierarchy guidance. Package: clip-split
   handoff notes + per-language VO files.
5. Notion: add Scene Breakdown v2 to subpage 02 (Faceless System).

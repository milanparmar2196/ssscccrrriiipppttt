# Review — MASTER_Phase4_ProductionPackage.md (user file, 2026-10-27)

> **Status (2026-10-27): REVIEW COMPLETE — the adopted items from this review are integrated into the specs/docs named inside; rejected items and their reasons are recorded here. This file is the review record, not a live spec.**

Question asked: do we need this? **Mostly no.** Their Phase 4 = our
Step 14 Production Package, which already exists and is stronger in
several places (multi-file ZIP vs their single document, Output
Format Profiles vs their one format, per-language VO, outdated
detection, Do-Not-Repeat auto-population, built-from version
manifest). ~80% is duplicate. Also their phase ORDER differs: package
first, then "Phase 5 Final Audit" — our order (Audit → Revision/
Approval → Package) comes from the user's own master workflow file
and is safer; do not adopt their order. The trailing blocks (plain-
text rules = now a Format Profile; compiler/manifest/output.md) are
their local file-system tooling — our package job + object storage +
outdated flag already do that job.

## Worth adopting (5 small additions)
- A1 **Entity Reference Sheet** deliverable — compiled from the
  registries the run actually used: spelling locks, pronunciation,
  status, legal/logo notes for every character/organisation/product
  appearing. (Their "Company/Person Reference Sheet", generalised
  beyond companies to all registry types.)
- A2 **Legal Review Summary** deliverable — high-risk claims table
  (scene / claim / risk / mitigation) compiled from scene
  legalRiskFlags + audit, disclaimers-included checklist, and a
  **Language Softening Log** (original → revised → reason) fed by
  audit auto-fix/revision records.
- A3 **Research References structure** — citations organised by
  scene + a consolidated bibliography grouped by source tier
  (tiers from the Master Source List).
- A4 **Metadata disclosure checklist** — description/metadata
  deliverable includes the Monetization Annex disclosure checks
  (sponsored, affiliate, ad-friendly, niche disclaimer present).
- A5 **Project Summary front sheet** — one-page package opener
  (title, angle, totals, versions used, key legal flags) rendered
  from data the manifest already holds.

## Not needed / already covered
All-scenes section, master VO script (Clean VO + word/WPM data),
data viz compilation (per-scene dataVizSpec + visual requirements),
AI prompts section (aiPrompts + handoff + format profiles, incl.
negative prompts via profile fields), final checklist (package
checklist + stage gates enforce the same items), production notes
(scene notes + revision log), their file-naming pattern (package
versioning + manifest).

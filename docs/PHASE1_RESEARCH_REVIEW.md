# Review — MASTER_Phase1_ResearchBible.md (user file, 2026-10-27)

> **Status (2026-10-27): REVIEW COMPLETE — the adopted items from this review are integrated into the specs/docs named inside; rejected items and their reasons are recorded here. This file is the review record, not a live spec.**

Question asked: do we need to add this? **The research core, no —
ours exists (Step 7 Research Brief: claims with sources, claim
statuses, unsourced verified_fact rejected, angle scope bounding
research, Master Source List, Bible §13 standards). But this file
sharpens verification in 6 concrete ways worth adopting.** Their
7-file structure, business-only source examples (SEC/FT/WSJ) and
MASTER_CONTEXT_v1 (superseded by our Run Continuity Context) are not
adopted; source types generalise per niche (official records,
original research, archival documents, scriptures…).

## Adopt (6 items)
1. **Claim Ledger fields** on our Claim DTO: `sourceLocation`
   (exact passage/page/section inside the source — verification is
   passage-level, not link-level), `accessedAt`, `confidence`
   (high/medium/low), `riskLevel` + risk note.
2. **Verification standard:** quantitative/figure claims require
   ONE primary source or TWO independent credible sources; source
   conflicts are resolved with the rationale recorded on the claim.
   (Generalises their financial Rule 2 to all niches' hard facts.)
3. **Source tiers formalised:** Master Source List / Source entries
   carry tier 1–5 (1 primary … 4 use-with-caution, 5 do-not-use =
   auto-blocked), matching the tiers already used in the Package
   bibliography.
4. **Timeline output:** research emits verified timeline events
   (date, event, significance, sources) that become Master
   Timeline/Chronology entries — feeds the audit chronology check.
5. **Research-stage legal flags:** claims accusing named people/
   entities, claims about living persons, and health-danger claims
   are flagged during research (risk None–Critical) and flow into
   scene legalRiskFlags + the Legal Review Summary; cautious-language
   standard ("was accused of / was charged with", never unproven
   wrongdoing as fact) written into Bible §13 defaults.
6. **"Leads are not evidence" rules:** topic ideas, presets, angle
   scope leads and shared source-library entries are discovery
   records only — verified status is never inherited; every claim is
   re-inspected (passage, date/version, limitations) in the run that
   uses it. Research Brief summary adopts their shape: story in 2–3
   sentences, why it matters now, central question (the run's story
   question), key turning points, legal/ethical flags.

## Already covered / not adopted
Phase rules 1/4/5/6 = our claim→source rule, §13 standards, audit
fairness checks (Phase 5 adoption). Financial verification protocol
details = Finance research template + Verified Data Registry +
verified-data-only config. Bias checklist = audit Section E
equivalent + §13. Their approval gate = our stage gates.

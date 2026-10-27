# Website Spec — apps/web

User-facing app: public marketing site **and** the authenticated SaaS
workspace where a faceless project is configured and every video
(Workflow Run) is produced through the master pipeline.

Stack-neutral spec. Recommended: Next.js + TypeScript, consuming
`services/api` only (no direct DB access), shared types from `packages/shared`.

## 1. Scope

**In scope**
- Public: landing, features (by pipeline phase), pricing, auth pages.
- App: dashboard, Workspace Projects (Personal / Brand, both faceless),
  Workflow Runs steps 1–15, optional modules 16–17, script/scene editors,
  audit & revision, production package download, performance feedback entry,
  library, credits/billing, settings.

**Out of scope**
- No audio/video generation, editing, voiceover, avatar, or rendering UI.
  Visuals appear as text: descriptions, stock search terms, AI image/video
  prompts, shot directions.
- No admin functionality (that is `apps/admin`).
- No direct publishing to YouTube etc. in MVP — publishing *optimization*
  outputs (step 17) are text deliverables in the package.

## 2. Users & Roles

- Visitor (public pages, pricing)
- User (owner of their Workspace Projects and Runs)
- **Brand projects in MVP are SOLO (D1, resolved 2026-10-27):** the
  brand owner is the only user on the project. Team collaboration —
  invitations, owner/editor/approver member roles, shared access,
  collaborative review/comments — is **explicitly deferred until
  after the Personal MVP** and does not exist in any MVP screen or
  API behaviour; nothing in the UI may imply it does. (Platform
  Admin roles from A9 — admin / super_admin — are a separate
  system and are not Brand roles.)

**Brand approval flow (solo, when Brand ships):** a Brand script
moves **Draft → In Review → Changes Requested → Approved →
Final**, and in MVP **the owner performs every transition
themselves** (self-review): the owner submits their own draft to
In Review, records Changes Requested (a note is required — it is
the owner's own revision brief) or Approved against a specific
script version, and Final locks that version (the Brand equivalent
of the run's Final Approval — after Final, edits create a new
version and the flow restarts at Draft). Every transition is
recorded in the script's **approval history** (from → to, actor =
owner account, timestamp, note) and the current state + history
are shown on the script; compliance check results attach to the
version under review. No other actor exists in MVP: no external
reviewer, no invite link, no comment thread.

## 3. Route Map

### Public
| Route | Purpose |
|---|---|
| `/` | Landing: faceless script pipeline, sample package, CTA |
| `/features` | Features grouped by Phase 1–8 |
| `/pricing` | Plans + credits explainer |
| `/login`, `/signup`, `/forgot-password` | Auth (API-backed) |

### App (authenticated, `/app/*`)
| Route | Purpose |
|---|---|
| `/app` | Dashboard: projects, active runs by stage, recent packages, credits |
| `/app/projects` | Workspace Projects list (Personal / Brand) |
| `/app/projects/new` | Create project wizard — Steps 1–3 + 6 + 8 (strategy, config, Bible) |
| `/app/projects/:projectId` | Project Home: strategy summary, Bible status, niches, topic bank, runs list |
| `/app/projects/:projectId/settings` | Edit strategy, configuration, niches/sub-niches, Bible versions |
| `/app/projects/:projectId/topics` | Topic Bank (Steps 4–5) for this project |
| `/app/projects/:projectId/runs` | Workflow Runs list with stage + status per run |
| `/app/runs/:runId` | **Run Workspace** — stepper for Steps 4–15 (see §5) |
| `/app/runs/:runId/package` | Production Package checklist, contents, downloads (Step 14) |
| `/app/runs/:runId/performance` | Performance Feedback Loop form + insights (Step 15) |
| `/app/library` | All scripts/packages across projects, search, duplicate |
| `/app/billing` | Plan, credits balance/history (credits are admin-granted — no checkout, no invoices; see §14) |
| `/app/settings` | Account, language defaults, notifications, YouTube connection, data export, account deletion (detail below) |

**Settings detail (A10):** `/app/settings` sections — **Account**
(email + password change); **Email verification** (current state
shown; *Resend verification* button when unverified, with the
cooldown/daily-cap state explained when a resend is not yet
allowed). **Verification gate in the UI:** an unverified user sees
a slim banner ("Verify your email to run generation") and every
job-start action explains, in place, that generation/research/
audit/package jobs need a verified email — with a Resend button
right there; browsing, manual editing, uploads, YouTube connect
and export all work unverified, and the buttons for them are never
blocked. The verification landing page handles three states:
verified (continue), **link expired** (explanation + Resend),
link already used. The API enforces the gate server-side
(`EMAIL_NOT_VERIFIED`) — the UI states mirror it, they are not the
enforcement; **YouTube
connection** (Connect / Disconnect, connected channel name, and the
connection state — a `reauth_required` state shows a Reconnect
action, `quota_exceeded` shows a notice that sync resumes when quota
resets; disconnecting keeps already-synced metrics, marked
last-synced); **Export my data** (per project: request an export,
then its state — pending → ready (download via signed link) →
expired, or failed with retry); **Delete account** (password
confirmation, a plain explanation of the grace period, and after a
deletion request the app shows a banner on next login offering
**Cancel deletion** until the grace period ends); **Notifications**
(preferences, as named above) and language defaults.

## 3A. Onboarding & Auth Screens (D2, resolved 2026-10-27)

**Flow:** Sign up → verification email sent (state shown:
sent/queued/delayed per the API's `emailStatus`; the A10 gate
applies — the user can log in and browse unverified, generation
and other paid-provider actions stay blocked until verified) →
optional **YouTube connect** step → dashboard.

- **Auth screens:** signup, login, forgot-password, reset-password
  (token from email, single-use, 1h), and the verification landing
  page (verified / expired-link-with-resend / already-used states,
  §3). **Password rules are identical at signup, reset and
  settings change** (API §3): minimum 10 characters, a live
  strength meter, very weak passwords rejected, and a
  breached-password check; if the breach check itself is
  unavailable, the password is accepted on the strength rules with
  the skipped check logged and a notice shown — signups never
  dead-end on a third-party outage.
- **First-project empty state:** a new account's dashboard shows
  what a project is, a **Create your first project** action, and
  an **Explore the sample project** action. No dead blank screen.
- **Sample project (read-only):** every account can open the
  platform sample — one complete, clearly-labelled SAMPLE journey:
  topic + research brief → Production Bible → scenes → audit
  report → final package, all labelled "Sample content" in lists,
  headers and the package itself. It is fully explorable with
  **no credits spent and no AI jobs runnable** (job actions are
  absent, not just disabled). A separate, explicit **Duplicate as
  my project** action copies it into the user's own workspace
  (Bible, config, lists, registries + the run as a completed
  reference run); until the user takes that action, nothing is
  copied. Otherwise the path offered is Create new project.
- **YouTube connect step (optional):** explains plainly what the
  connection enables — syncing the channel's performance metrics
  (views, retention, engagement) into Step 15 for the user's own
  published videos — and that it requests **read-only access only**
  (the A10 scopes). **Skip** is always available; the step can be
  done later in Settings → YouTube connection. The whole
  script-writing workflow works without it (metrics then come from
  manual entry/CSV). Failure/cancel states: if the Google flow is
  cancelled or fails, onboarding returns with "YouTube didn't
  connect — retry, or connect later in Settings" and **no error
  blocks the rest of onboarding**; a connected state shows the
  channel name with a Disconnect option.
- Every onboarding screen carries explicit loading, success and
  error states (including the delayed-verification-email state
  with its resend limits from API §3).

## 3B. Lifecycle — Archive, Delete, Drafts, Suspension (D3)

- **Projects / Runs lists** have an **Archived view**; archived
  items open read-only with an **Unarchive** action and a banner
  explaining the state. Archiving never changes credit history —
  the billing page is untouched by it.
- **Delete** (projects and runs) asks for confirmation naming
  exactly what will be removed, then shows the item in a
  **Recently deleted** state with its purge date and a **Restore**
  action for the 30-day window; after purge it is gone and the UI
  says so plainly (exports already downloaded are the user's own
  copies and are unaffected — stated in the confirmation).
- **Drafts:** wizard drafts show "Last saved … · expires …" with
  **Resume** and **Discard**; an expired draft is simply gone from
  the drafts list (it never deletes a created project).
- **Suspended state:** a suspended user who logs in sees one
  screen — the account is suspended, a plain explanation, and the
  platform contact email — with no app access behind it. Their
  work is not deleted and returns in full if the account is
  reactivated (stated on the screen).
- Retry affordances on failed stages always show the **estimated
  cost before confirming** (the standard job confirm flow).

## 4. Project Creation Wizard (Project-level, once)

Mirrors master order — do not invent a different order in UI:

1. **Step 1 — Niche:** select from the dynamic taxonomy (from API) or
   create a custom niche. **Unlimited niches allowed** (personal project,
   fully dynamic — no cap anywhere); at least 1 required to proceed.
2. **Step 2 — Sub-Niche:** per niche, add/select sub-niches — also
   **unlimited per niche**. Each needs a one-line content focus +
   target audience note.
3. **Step 3 — Audience & Channel Strategy:** audience profile (age, region,
   knowledge level, interests, pain points), language, tone (see §6),
   channel identity (name, promise), platform, video format, content goals.
4. **Step 6 — Configuration Questions:** video length target, storytelling
   style, narration format, visual style (see §6), CTA, output requirements
   (which package deliverables are required for this project/platform).
   Steps 4–5 (topics) intentionally come *after* strategy and *before* a
   Run — they live in the Topic Bank, not this wizard.
5. **Step 8 — Production Bible (draft):** API generates a Bible draft from
   Steps 1–3 + 6 (+ research defaults). The Bible has **14 sections**
   (canonical list in API Spec §5): the original 8 — Channel Promise,
   Audience, Tone, Language, Visual, Structure, Packaging, Compliance —
   plus Voice & Narration, Glossary & Pronunciation, Music & Sound,
   Series & Continuity, Research & Evidence Standards, and Performance
   Learnings Log. User reviews each Bible section in a section-by-section
   editor (the Learnings Log starts empty and is read-only in the wizard —
   it fills only via approved Step 15 learnings), edits, and **Approves**.
   Below the 14 sections, the editor shows the project's **active Bible
   Annexes only**: Monetization & Sponsor and Accessibility (toggleable
   per project), plus the niche-dependent annex from the applied Niche
   Template — for person-based documentary niches the Character
   annex editor holds the portrayal rules + dialogue policy (A12:
   character data itself is edited in the **Registries** tab; this
   annex is rules only), or a subject registry editor (herbs/ingredients
   for Ayurveda, places/regions for Geography) for subject niches.
   Annexes a niche does not use are never shown.
   The Bible screen also shows, for the current Bible version, a
   **Character snapshot panel** (A12, person niches): the entries
   frozen in this version, a **drift badge** when the living
   Character Registry has changed since ("3 characters changed, 1
   new"), and a **Review changes** action — a per-entry diff whose
   "Include in a new Bible version" path creates a draft version
   with a fresh snapshot through the normal approval flow. Locked
   versions never change in place, and a pre-A12 project's
   `migration_conflicts` (same character in both old homes with
   differing fields) appear here for resolution, both copies shown.
   The Bible screen also has a **Proposed Edits inbox** (A10):
   learnings proposed from Step 15 Performance (and any other
   proposed Bible edits) arrive here as diffs against the current
   Bible version — **Approve** applies the edit by creating a new
   Bible version (existing versioning rules), **Reject** dismisses
   it with the reason kept in the version history. Nothing enters
   the locked Bible without passing this inbox.
   The Bible screen also has a **Master Lists** tab — managers for the
   7 living registries (Source List, Do-Not-Repeat, Master Timeline,
   Locations & Settings, Hook & Opening Library, Phrase Bank, Asset
   Sources): searchable entry CRUD, with the Do-Not-Repeat list mostly
   auto-filled from completed packages (the user can remove wrong
   entries or add manual ones). A Run's Overview shows which list
   entries that run used (its snapshot).
   The Bible screen also gains a **Registries** tab: the project's
   active registry modules only (per docs/REGISTRY_MAP.md — e.g.
   Character + Case/Event for a history project, Creature + Place for
   wildlife), with entry CRUD/search and locked-description fields.
   Run creation (Topic step) includes **Angle selection**: pick one
   of the niche's Angles and enter the concrete story question; the
   angle's scope is shown and becomes the run's research boundary.
   **Angle selection — screen spec (C-block):** the picker lists the
   niche's angles (name + one-line angle statement), each expandable
   to show its full question framing, scope (what's in/out),
   evidence expectations and boundary; a required **story question**
   field takes the concrete question for this run (prefilled from
   the angle's question, editable); the selection + question +
   angle version are snapshotted onto the run and shown read-only
   in the Run Overview, and the Research stage header repeats the
   scope as the visible research boundary. **Empty state:** if the
   niche has no angles yet, the step says so and points to where
   angles are created (Admin — Angle Registry on the niche; CRUD
   exists since A10); the run is then created with the story
   question alone, records `angleId: null`, and the Research stage
   shows "no angle scope — question only" as its boundary state,
   so a scope-free run is always visible as one, never silent.
   **Title-only angles (2026-10-27):** most seeded angles carry a
   title only (question/scope/evidence/boundary not yet written —
   the ANGLES_MASTER.md import). The picker badges them **"Title
   only"**; selecting one behaves exactly like the question-only
   path: the story question field is required (nothing is
   prefilled, nothing is assumed), the run records the angle as
   title-only, and the Research stage header shows "title-only
   angle — question only, no scope boundary" until an admin
   completes the angle's fields (which affects new runs only).
   In the wizard, the Bible Visual section is presented as the
   niche's **Visual Archetype card** (palette chips, prompt keywords,
   thumbnail rule from docs/VISUAL_STYLE_SYSTEM.md) with per-project
   override editing; the Scene Breakdown shows the assembled image
   prompt (archetype keywords + registry locked descriptions + scene
   visual) before generation.
   → Bible v1 locked. Project cannot start a Run until a Bible version
   is approved (Control Rule 3/5).

Wizard UX rules: save-and-resume at any step, progress indicator using
master step names/numbers, every AI generation shows credit estimate →
confirm → job progress → result (never a blocking spinner page).

## 4A. Reuse: Niche-wise Questions & Niche Templates

- **Niche-wise questions in the wizard:** after the user picks a niche
  (and sub-niche), the configuration form is built from the API's
  resolved list for that niche — Global + Niche + Sub-Niche questions,
  in Admin-defined order (see §6 Dynamic Form). Switching niche/sub-niche
  reloads that niche's list; answers for questions no longer in the list
  are kept on the draft (marked "not in current set"), never silently lost.
- **Apply a Niche Template (in the wizard, right after niche selection):**
  if the selected niche has template(s), show a template picker
  (Default pre-selected) with a per-section preview of all **10**
  sections: Strategy Defaults,
  Configuration Defaults, Bible Template, Questions Set, Research Template, Structure
  Templates, Scene Template, Audit Add-ons, Packaging Defaults,
  Registries — the Registries preview shows the niche's *resolved*
  registry set (primary + secondary) with a badge for its source:
  category default, niche override, or template-explicit (A8).
  [Apply Template] pre-fills those wizard/Bible values as a snapshot —
  every pre-filled field remains fully editable. [Skip] continues blank.
  Multiple templates per niche are supported; sub-niche selection layers
  that sub-niche's template overrides on top.
- **In a Run:** Structure Templates, Research Template checklist, and
  Audit Add-ons from the project's applied niche template are the
  defaults offered at Steps 7, 9, and 12; the user can pick another
  structure template of the same niche per run.
- **Save As Template:** Project Settings and Run Summary both offer
  "Save setup as Niche Template" (name + scope: My Templates). This
  captures the current working setup so a good project becomes the
  reusable starting point for the next channel/project in that niche.
- **Template update notice:** Project Home shows a non-blocking banner
  when a newer version of the applied template exists, with a section
  diff and explicit [Review & Apply] — nothing auto-updates.

## 5. Run Workspace (one video, Steps 4–15)

Persistent layout: left = pipeline stepper (Steps 4–15 with status:
`locked / ready / in_progress / awaiting_approval / done / failed`),
center = current step screen, right (collapsible) = Run Summary
(topic, niche/sub-niche, Bible version, config summary, open issues count).

A step is only clickable when the API stage-gate allows it (Control Rule 1).
Locked steps show *why* (which previous approval/output is missing).

| Step | Screen | Main actions | Gate to next |
|---|---|---|---|
| 4 Topic List | Topic ideas table/cards: AI-generate (by niche+sub-niche, count selectable), add manually, edit, dedupe warning | Generate, Add, Edit, Delete | At least 1 topic exists |
| 5 Topic Evaluation & Selection | Scoring matrix (§7), sort/filter, topic detail drawer | Score, Compare, **Select Topic (approval)** | 1 topic selected |
| 6 Configuration Questions | Run-level config form, defaults pre-filled from project, override per run | Edit, Save | Required fields complete |
| 7 Research & Fact Verification | Research brief: facts, stats, dates, examples; claims list with source per claim; conflicts panel; fact vs assumption/speculation labels; **research mode picker** (project default shown, run-level choice: curated-first / curated-only / web-only / selected-sources-only); **gap prompt** and **web-discovered sources** visibly labelled (detail below) | Run Research (job), Add Source, Flag Claim, Approve Research | Research approved; no claim without source passes |
| 8 Production Bible | Read-only Bible version locked to this Run + diff if project Bible changed since | Confirm Bible version | Bible version confirmed for Run |
| 9 Narrative Structure & Outline | Outline editor: Hook, Intro, Setup, Developments, Conflict/Tension, Revelations, Transitions, Climax/Payoff, Conclusion, CTA — reorder, edit, add/remove | Generate Outline (job), Edit, **Approve Outline (approval)** | Outline approved |
| 10 Script Drafting | Script editor (narration text), word count + estimated duration vs target, per-section regenerate | Generate Draft (job), Edit, Regenerate Section | Draft complete within duration tolerance (project config) |
| 11 Scene Breakdown | Scene table/cards (§8), totals bar, Clean VO toggle view | Generate Scenes (job), Edit Scene, Add/Split/Merge/Reorder, Regenerate Scene Visual/Narration | Every scene has narration + visual (hard validation) |
| 12 Audit & Quality Control | Audit report (§9): scores per area, failures with scene numbers | Run Audit (job), View Failure, Jump to Scene | Audit run complete |
| 13 Revision & Final Approval | Revision queue from audit failures, auto-fix per scene/section, re-audit, unresolved-issues panel, **Final Approval (approval)** | Auto-Fix, Edit, Re-Audit, Flag for Human Review, Approve Final | All mandatory criteria pass, or override + unresolved flags recorded |
| 14 Production Package | Package builder (§10) | Select deliverables, Generate Package (job), Download ZIP / individual | Audit passed/overridden + Final Approval done |
| 15 Performance Feedback Loop | Metrics entry/import + insights (§11) | Add Metrics, View Insights | Optional to close Run; feeds Topics (Step 4/5) |
| 16 Visual & Asset Research (opt.) | Per-scene asset list: footage, archive images, graphics, music; licensing/attribution/rights status per asset | Research Assets (job), Mark Verified | If enabled: no unverified asset in Package |
| 17 Platform & Publishing Optimization (opt.) | Titles, description, thumbnail brief (text), chapters, subtitles/captions plan, tags, publishing recommendations | Generate (job), Edit, Include in Package | If enabled: outputs attach to Package |

**Step 7 research detail (A1 — docs/RESEARCH_SOURCES.md):** research is
**curated sources first**. The mode picker sits above Run Research,
pre-set to the project default; changing it is a run-level choice. In
curated-first mode, when the library can't support an important part
of the script, research pauses on a **gap prompt** that names the
specific unsupported parts — the user chooses *Approve web search for
these gaps* or *Continue without web search*; the platform never
searches silently. If material is still insufficient (or the mode is
curated-only / selected-only), an **insufficient-evidence panel**
offers a *narrower script on supported material* (with the proposed
reduced scope shown before accepting) or a plain cannot-support
explanation listing what was searched and what's missing — claims are
never invented to fill the hole. Sources found via approved web
search appear in the brief and the Package bibliography under a
**Web-discovered** label, separate from library/approved sources,
each with review actions (approve for this project / request global
promotion / leave unapproved / block). Every source shown anywhere
(brief, claims, bibliography) displays **origin, credibility tier,
and review status as three separate values** (A5) — a source is
never presented as approved when its review status is pending, and
tier 5 sources are shown as blocked/do-not-use. Health claims are badged with
their risk level; traditional-use claims (e.g. Ayurvedic) are worded
and displayed as traditional use, distinct from clinically evidenced
claims, and high/critical health claims hold research approval until
a person reviews them.

**Similarity checks (A2 — docs/MODEL_PROVIDERS.md §5):** wherever the
platform compares content (topic dedupe at Steps 4–5, Do-Not-Repeat
matching, originality at Step 12), the user sees the **matching
items with their semantic + keyword scores and enough context to
compare side by side** — never a bare verdict. A match is an
indicator, not a rejection: *Continue anyway* is always available
for intentionally related topics, and the acknowledgement is
recorded. If the semantic check could not run (provider unavailable
or vectors stale), the screen states that plainly — e.g. "Semantic
check not completed — keyword matches only" — and nothing is shown
as *original* or *clear* until the required checks have actually
run (Step 12 shows originality as **Not completed** in that case).

## 6. Configuration Fields (Steps 3 + 6, shared components)

**Fully dynamic rule (user decision, 2026-10-27):** the fields/questions
below are the *seed* set, not a hard-coded form. The configuration form is
rendered by a Dynamic Form component from the API question schema
(`GET /config-schema`, Admin Spec §8): question type, options, order,
grouping, required flag, defaults, and conditional visibility all come
from data. A question/preset/niche added in Admin appears here with no
code change. There is **no limit** on how many questions a flow can
contain; grouping + conditional visibility (from the schema) keep long
flows usable. Well-known fields below map to typed config fields; purely
dynamic questions store answers by question `key` and feed prompts via
their `mapsTo.promptVariable`.

- **Tone (as per requirement, not a single dropdown):** primary tone
  (preset list from API + custom), secondary tone, intensity,
  narrator persona, pacing, sentence style, humour level, emotion level,
  formality. Rendered as a Tone Builder component, reused in project
  settings, Run config, and sub-niche overrides.
- **Language:** primary language, level (simple/standard/advanced),
  slang allowed?, narration style (formal/conversational/storytelling),
  use/avoid word lists.
- **Audience:** segments, age, region, knowledge level, viewer goal,
  pain points, post-watch feeling/action.
- **Visual Style:** primary type (stock / AI images / animation / maps /
  charts / screen / archive / text / mix), mix note, mood, colour feeling
  (text), visual pacing (seconds per visual), visuals to avoid,
  on-screen text style.
- **Sub-niche override:** any field above may be overridden at sub-niche
  level; UI must show "inherited vs overridden" state clearly.

## 7. Topic Evaluation (Step 5)

Score each topic 1–10 on API-provided criteria matching the master
workflow: Audience Interest, Originality, Storytelling Potential,
Research Feasibility, Relevance, Production Requirements — plus
Visual Feasibility (faceless). Show total + per-criterion scores,
allow manual score adjustment (recorded as user override), sort by total.
Selection is an explicit approval action with confirm dialog.

## 8. Scene Breakdown Editor (Step 11)

Columns/fields per scene (all from API Scene DTO, `packages/shared`):
Scene No, Chapter, Section, Purpose, Narration (VO, clean text only),
Speaker Label, Visual Direction, Shot Description, Footage Requirement,
AI Image Prompt, AI Video Prompt, On-Screen Text, SFX, Music Cue,
Transition, Estimated Duration. **Chart scenes (D4):** a scene with
a chart opens the **DataVizSpec editor** — chart type (from the
project's vocabulary version), purpose, series with their evidence
links (Verified Data / claim picker — an unlinked series shows
`missing_evidence` in place), axis/scale fields with the
zero-baseline rule explained, the on-chart source note, and the
key-finding text for accessibility. Validation problems list
exactly what to fix and the scene shows as incomplete until fixed;
a chart type the vocabulary doesn't have yet is saved as a
**draft request** (with a note that it's queued for Admin review),
never silently swapped for another type. Plus the Camera & Animation Direction
fields (docs/BIBLE_FILE_MAPPING.md): `shotType`, `cameraMove`,
`animationNote` — dropdowns from the controlled vocabularies, with
per-archetype defaults pre-filled. **Scene v2 fields**
(docs/SCENE_BREAKDOWN.md): Characters/Locations/Props are picked from
the run's registries (locked descriptions shown, not free text),
Period label, **Claim IDs + Sources** (chips linking to the Research
Brief claims), **Legal Risk flag**, and an optional Data Viz spec
block (chart type, data, source, animation note) when the scene
directs a chart.

Scene cards also show **continuity state** (start/end state chips —
a mismatch with the previous scene's end state is highlighted),
reference inputs, editorial overlay instructions, and an optional
shot-recipe picker from the project's Shot Recipe Library
(docs/PHASE2_ADDITIONS.md G1/G6).

Rules in UI: duration auto-estimated from narration word count + pacing;
each scene shows a **word-budget indicator** (narration words vs the
seconds available at the Bible's WPM pace — under / near / over, with
the chart-sync hint on data scenes); totals bar shows scene count,
total words, estimated duration, and **scenes missing visual = must
be 0** to continue. Clean VO view is a toggle that renders narration
only, in order, read-only-mapped-to-scenes. Generation runs in
**ranges of 25 scenes**; a **Continuity Context** panel shows what
the run has established (characters, locations, facts, deviations)
and updates per range; project setting `sceneReviewMode` can pause
after the first range for review before the rest generate.

## 9. Audit UI (Steps 12–13)

Audit areas (from API): Factual Accuracy, Source Reliability, Originality,
Narrative Coherence, Pacing, Engagement, Repetition, Continuity,
Production Feasibility, Duration Fit, Project/Bible Compliance
(+ Brand Compliance on Brand projects). Each area: score /10 **and
its weight**, combined into the total by the weighted formula
(API Step 12, A4): total = Σ (score ÷ 10 × weight), applicable
weights summing to 100; pass threshold (API config, default 80).
The report header shows the total, the weight-config version used,
and — separately, never blended into the score — the **Editorial
Depth verdicts** per deliverable. N/A areas are shown as N/A with
their reason and a note that their weight was redistributed. If a
required area could not be assessed, the report is badged
**Incomplete** (with the missing areas named) instead of showing a
misleading total; a **critical-issue banner** appears when a
critical check blocks passing regardless of the total.
Failures list: check, scene number(s), explanation, suggested fix,
[Auto-Fix] [Edit Scene] [Flag Unresolved]. Re-audit button re-runs only
failed areas (API decides). Unresolved items stay visible in Run Summary,
Package, and Audit Report — never hidden (Control Rule 11 in workflow: track unresolved items explicitly; there is no Rule 13 — the workflow has exactly 12).
Checks recorded **N/A show with their reason** (collapsed by default,
counted in the report header). On Final Approval the run issues its
**Completion Certificate** (versions audited, verdict, fail/N/A summary —
text package only), viewable here and included in the Package.

## 10. Production Package (Step 14)

Checklist first (each item green/amber/blocked): Project Summary
(front sheet: title, angle, totals, versions, key legal flags), Final
Script, Scene Breakdown, VO Instructions, Visual & Footage Requirements,
AI Image/Video Prompts, Camera & Shot Directions, Music & SFX Cues,
On-Screen Text & Graphics, Captions & Subtitles, Title Suggestions,
Thumbnail Concepts (text), Description & Metadata (with the
Monetization Annex disclosure checklist verified), Research References
& Source Notes (by scene + tiered bibliography), **Entity Reference
Sheet** (spelling/pronunciation/status/legal notes for entities used),
**Legal Review Summary** (high-risk claims, disclaimers, language
softening log), **Viewer Glossary** (audience-facing, from the run's
§10 entries), **Completion Certificate** (the run's certificate from
Final Approval, with a **View** action), Editing Instructions, Production Checklist.
(These labels are the display names of the canonical
`PACKAGE_DELIVERABLES` keys in Shared §5 — A11; this screen
references that list and never defines its own keys.) The Package
screen also shows the run's **Generator Profile** (tool/model/version
+ verified capabilities) beside the format-profile picker, and keeps
prior package versions downloadable (history).
Only deliverables required by project config/platform are mandatory;
others are optional toggles. The AI Generation Handoff + VO files
render through an **Output Format Profile** (per target tool —
docs/OUTPUT_FORMAT_PROFILES.md): a profile picker (default from the
the run's asset method — config answer B18) with a **render preview**, so the creator
sees the script exactly as their video/audio tool will receive it
before downloading. Downloads: ZIP (all, with scene breakdown as
CSV/sheet + docs as PDF/DOCX) or per-item. If script/scenes change after
packaging, banner: "Package outdated — regenerate".

## 11. Performance Feedback Loop (Step 15)

**YouTube API integration from day one** (user decision, 2026-10-27):
the user connects their channel once (OAuth), and metrics sync
automatically per published video; manual entry + CSV import remain
available as fallback/correction. Metrics shown:
CTR, retention %, average view duration, engagement (likes/comments),
drop-off points (timestamp + note). Insights panel (API-generated):
what worked in hook/pacing/structure, recommendations applied as
suggestions to: Topic Evaluation weights note, Bible section 14
**Performance Learnings Log** (proposed edit creating a new Bible
version, user approves — never auto-edits the locked Bible),
and future Topic List generation context for this project.
**Run ↔ video matching (A10):** each run's Performance screen has a
**YouTube video** field (paste the published video's URL or ID) —
until it is set, the run shows "not matched" and sync does nothing.
**Sync status** is shown per run: synced (with last-sync time) /
never synced / `quota_exceeded` (metrics resume when quota resets) /
`reauth_required` (link to Settings → YouTube connection to
reconnect). **Corrections Log:** the screen carries a post-publication
**Corrections Log** section — add a correction entry (what was wrong,
what changed, date) and view the run's entries; entries are part of
the run record and surface in the Project Summary history.

## 12. Global UX / State Rules

- Every list/detail screen: loading skeleton, empty state with next
  action, error state with retry — no blank screens.
- All AI actions follow: **Estimate credits → Confirm → Job progress
  (poll API job) → Result → Save as new version**.
- Autosave for all editors (script, scenes, outline, Bible) with
  version history drawer (view/restore; restore creates a new version).
- **File uploads (A10):** wherever a file is attached (scene reference
  inputs, Brand assets, Step 16 asset items), each file shows its own
  state — uploading → verifying → ready, or failed with the reason and
  a **Retry** action; an item that depends on the file cannot be
  marked complete until its files are `ready`.
- Credit balance always visible in app header; insufficient-credit
  state blocks the confirm step with a clear explanation that
  credits are granted by the platform admin (no self-serve top-up
  exists — there is no billing provider) and how to request more.
- Accessibility + responsive: Run Workspace usable on tablet; scene
  table may switch to cards on small screens.

## 13. Acceptance Criteria (Web)

- A new user can: sign up → create a project (Steps 1–3, 6, Bible
  approval) → generate & evaluate topics → select a topic → complete a Run
  to a downloadable Production Package, without leaving the stepper flow
  or hitting a step out of master order.
- No step can be completed in UI if the API gate rejects it; the UI
  explains the blocker in plain language.
- A scene without a visual cannot be saved as "complete".
- Package cannot be generated before Audit + Final Approval (or recorded
  override).

## 14. Open Decisions

- Framework confirmation (recommended Next.js) and design system source.
- ~~Billing provider and credit pack vs subscription-only model.~~
  **Resolved 2026-10-27:** NO billing provider — plans/credits are
  internal Admin-managed entitlements only (see §3 Credits).
- ~~Whether Step 15 metrics are manual-only for MVP.~~ **Resolved
  2026-10-27:** YouTube API integration from day one (OAuth +
  Analytics sync); manual entry + CSV remain as fallback (see §11).

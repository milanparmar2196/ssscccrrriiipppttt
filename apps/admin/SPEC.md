# Admin Panel Spec — apps/admin

Internal-only admin application. Separate app and deploy from `apps/web`,
stricter auth, no public signup. All data via `services/api` admin
endpoints (RBAC: `admin`, `super_admin` — platform roles only;
they are unrelated to Brand project membership, which is solo-owner
in MVP with team roles deferred, D1). Admin never talks to the DB
directly and never bypasses API stage-gates, audit, or credit rules —
admin actions are audited API calls.

## 1. Scope

**In scope**
- Platform overview & health, user management, project/run monitoring,
  workflow quality monitoring, niche taxonomy & presets management,
  prompt/model configuration per workflow step, plans & credits control,
  feature flags (incl. optional modules 16–17), content safety review,
  system audit logs, support tools.

**Out of scope**
- Creating/editing user scripts as a user (admin may view for support /
  quality, and may flag — content edits are done as a recorded support
  action, never silently).
- Marketing site content (later CMS, not in this spec).
- Billing — **no payment provider** (user decision, 2026-10-27:
  personal project). Plans/credits are internal entitlements managed
  in Admin only; there is no checkout, subscription or payment
  processing anywhere in the system. A provider can be added later
  without changing the plan/credit model.

## 2. Users & Roles

| Role | Access |
|---|---|
| `super_admin` | Everything, incl. admin-user management, model/prompt config publish, plan changes, flag changes |
| `admin` | Day-to-day ops: users, projects/runs (read + support actions), taxonomy, quality queues, support |
| `support` (NOT in MVP — user decision 2026-10-27, admin-only) | Read-only user/project/run views + support notes, no config or credit changes |

Admin auth (**bootstrap model — A9, 2026-10-27**, supersedes the
single shared .env login): separate login route. **One bootstrap
super-admin credential** lives in the server `.env`
(`ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`) for initial
setup and controlled recovery only. **Regular admin users are
individual database records** (`AdminUser`: email, securely hashed
password, role, status) created and managed by a super_admin.
- **Lifecycle:** on first boot with no `AdminUser` rows, the
  bootstrap login is active and its first task is creating the
  first real super_admin account; the bootstrap login stays
  available afterwards for recovery (e.g. resetting a locked-out
  admin's password, restoring access if all admin accounts are
  lost). **Rotation:** change the `.env` values + restart the API —
  all bootstrap sessions are invalidated, and the rotation itself
  is written to the audit log at next bootstrap use.
- **Attribution:** roles are enforced server-side on every admin
  action; every mutation records the individual `AdminUser`
  responsible in `AdminAuditLog`. Actions taken through the
  bootstrap login are recorded with the distinct actor
  `bootstrap` — never disguised as a regular admin.
- **Protection:** login is rate-limited (per IP + per account,
  lockout/backoff after repeated failures); admin sessions are
  short-lived with refresh rotation, and shorter than user-app
  sessions. Credentials never appear in the UI (beyond the login
  form), logs, seed files, or API responses.
- **MFA:** not required for this personal deployment (standing
  decision), but the account model is MFA-ready — the login flow
  has a reserved second-factor step and `AdminUser` carries
  nullable MFA fields, so TOTP can be switched on later without a
  data migration.
- `.env` is never committed to git (`.gitignore` from day one) and
  never exposed to the client apps.
- **Migration from a single-admin install:** an installation that
  only ever used the .env login upgrades by booting once with the
  bootstrap credential (same values), creating the first AdminUser
  from it, and continuing — no access is lost and no data changes;
  past audit rows keep their original attribution.

## 3. Route Map

| Route | Purpose |
|---|---|
| `/login` | Admin login (no signup) |
| `/` | Overview Dashboard (§4) |
| `/users` , `/users/:userId` | User list, detail (§5) |
| `/projects` , `/projects/:projectId` | All Workspace Projects, read/support view (§6) |
| `/runs` , `/runs/:runId` | All Workflow Runs, stage monitoring, stuck/failed runs (§6) |
| `/quality` | Audit Quality Center: audit scores, failure patterns, unresolved flags (§7) |
| `/taxonomy` | Fully dynamic Niche / Sub-Niche library, tone & visual style presets, structure/hook templates (§8) |
| `/taxonomy/:nicheId/questions` | Per-niche question assignments: Assign/Clone from the Question Library with per-niche order/required/default overrides (§8) |
| `/annex-templates` | Bible Annex Library: annex templates with dynamic fields, activated per niche (§8) |
| `/questions` | Fully dynamic Configuration Questions builder — global / niche / sub-niche / step questions (§8) |
| `/niche-templates` | Niche Templates: reusable per-niche template bundles (defaults, Bible, research, structures, scene, audit, packaging) (§8) |
| `/format-profiles` | Output Format Profiles library: per-tool script format rules (text style, separators, labels, clip caps, fields) that Production Package handoffs render through (docs/OUTPUT_FORMAT_PROFILES.md) |
| `/prompts` | Prompt templates per pipeline step, model assignment, versioning & publish (§9) |
| `/model-providers` | AI Model Providers: provider registry (OpenAI, Claude, Gemini, Grok, GLM, Kimi, DeepSeek, Qwen, Meta/Llama, Xiaomi MiMo, MiniMax + custom OpenAI-compatible endpoints), per-provider model catalogue, per-stage provider+model assignment with fallback chains (§9, docs/MODEL_PROVIDERS.md) |
| `/source-library` | Global Source Library: curated research sources, starter bundles, niche coverage, web-discovery review queue (§8, docs/RESEARCH_SOURCES.md) |
| `/seeds` | Seed Data: versioned seed files, import reports and conflict resolution (docs/SEED_DATA.md) |
| `/plans` | Plans, credit grant bundles, credit adjustments (§10) |
| `/flags` | Feature flags & optional modules, per-plan / per-user rollout (§11) |
| `/safety` | Content Safety Queue: flagged claims, banned content, user reports (§12) |
| `/performance` | Platform-level performance insights (aggregated Step 15 data) (§13) |
| `/logs` | System & Admin Audit Logs (§14) |
| `/settings` | Admin users & roles, platform settings (audit threshold default, duration tolerance, job limits) (§15) |

## 4. Overview Dashboard

Cards + charts (all API-aggregated, date-range filter):
- Users: total, new, active (DAU/WAU/MAU if tracked), plan distribution
- Projects & Runs: projects created, runs started, runs completed to
  Package, runs by current stage (funnel of the 15-step pipeline —
  drop-off by stage is a primary chart)
- Generation: AI jobs by step (topics, research, outline, draft, scenes,
  audit, package, optional modules), success/failure rate, avg job time,
  total credits consumed
- Quality: average audit score, audit pass rate (first attempt vs after
  revision), most common audit failure areas
- Credits: credits granted vs used, active plan members (nothing is sold in-app — no billing provider)
- Alerts strip: failed jobs spike, runs stuck in a stage > X hours,
  safety queue count, unresolved-flag count

## 5. User Management

- List: search by name/email/id, filters (plan, status, created range,
  credits balance), sort.
- Detail: profile, plan & credits (balance, ledger link), projects &
  runs (counts + links), usage by step, account status, support notes.
- Actions (all logged, reason required in UI):
  - Suspend / reactivate account (blocks API access, does not delete data;
    user-facing behaviour per D3/API §4A: queued jobs cancelled with
    holds released, running jobs cancel at the next unit boundary,
    the user sees only the suspended screen with the platform
    contact path, and everything returns intact on reactivation).
    Admin user/project views also surface lifecycle states
    (archived, pending_deletion with purge date) read-only — admins
    never archive or delete user content themselves (D3)
  - Adjust credits (+/−, with reason; creates a ledger entry via API —
    admin UI never edits a balance number directly)
  - Change plan (super_admin, or admin if policy allows — API enforces)
  - Resend verification / password reset (triggers API flow, admin never
    sees or sets a user password)
  - **Contact user** (C-block): sends an email to the user through
    the platform's transactional email system (template
    `admin_message`: admin-written subject + body, platform sender —
    the admin's own address is never exposed). The message is logged
    in the AdminAuditLog (actor, user, subject, timestamp — body
    retained in the log record) and a copy appears in the user's
    in-app notifications. There is no other admin→user channel in
    MVP (no in-app chat); support conversations continue over email.
  - Impersonation: **not in MVP.** If added later, must be super_admin,
    time-boxed, banner-visible, and fully logged.
  - Account deletion (A10): users who have requested deletion appear
    with their state — **in grace period** (requested date, scheduled
    purge date) or **deletion_failed** (with the failure reason from
    the deletion job). Admin may **retry a failed deletion job**;
    admin can never cancel a user's deletion, delete a user's content
    directly, or purge ahead of the grace period — deletion is the
    user's flow (API `DELETE /me`), admins only observe and retry.

## 6. Project & Run Monitoring

- Projects list: owner, type (Personal/Brand), niches, Bible status/
  version, runs count, last activity. Detail is a read-only mirror of
  the user Project Home + strategy/Bible/config (secrets/PII not shown
  beyond operational need).
- Runs list: project, topic, current step (1–17 label), stage status,
  audit score, credits used, created/updated, stuck indicator.
- Run detail: full stage timeline (started/completed/approved by/at,
  job ids), current artifacts (research, outline, script version,
  scene count, audit report, package status), `openIssues[]`.
- Support actions: retry a failed job (same parameters), cancel a stuck
  job, add internal support note. Admin cannot approve a step on behalf
  of a user, skip an audit, or mark an unresolved issue as verified
  (Control Rules 5, 9, 11) — UI must not offer such actions.

## 7. Audit Quality Center

Purpose: keep generation quality measurable across the platform, not
only per user.
- Audit score distribution, pass rate trend, score by niche/sub-niche,
  by model/prompt version, by step.
- Failure pattern table: audit area → failure check → occurrence count →
  sample runs (links). Used to decide prompt/taxonomy fixes.
- Unresolved flags queue: runs where Step 13 flagged issues for human
  review; admin can view context and add an internal note / contact the
  user — admin does not clear the user's flag; only a new user-approved
  revision clears it in the user app.
- Threshold setting is in `/settings` (platform default) — changing it
  affects new audits only; UI shows that note explicitly.
- **Audit weights (A4):** this Center also manages the
  `AuditWeightConfig` — per-area weights for the weighted /100 total
  (API Step 12), with separate default sets for standard and Brand
  projects. Saving validates the config (weights ≥ 0, every
  applicable area > 0, applicable set sums to exactly 100) and bumps
  the config version; invalid configs are rejected. Every audit
  records the weights + version it used, shown in run drill-downs,
  so historical scores stay interpretable. Editorial Depth is not
  weighted — it is a verdict layer, not an area.

## 8. Taxonomy, Presets & Configuration Questions — FULLY DYNAMIC, NO LIMITS

**Decision (user, 2026-10-27): this is a personal project. No limitation
is needed. Everything in this section is fully dynamic — no hard-coded
counts, caps, or lists in code, and no code deploy to add an item.**

**Seed data (A7, docs/SEED_DATA.md):** all install-time
configuration ships as versioned seed JSONs in `docs/seeds/`
(taxonomy, questions, archetypes, registries, profiles, annexes,
audit checklists, glossary, models), generated from the canonical
docs and validated (report in `docs/seeds/VALIDATION_REPORT.md`).
The `/seeds` page runs imports and shows the import report;
locally modified records appear as **conflicts** to accept or
reject per record — imports never silently overwrite Admin edits
or user-created data.

**Seed taxonomy:** `docs/NICHE_LIST_MERGED.md` (v2, supersedes
`docs/NICHE_LIST.md` v1) — its category names are **canonical**, and
every category carries a stable **`categoryKey`** (A6): display names
may be edited here, keys never change, and all assignments/mappings
(registry map, visual archetypes, question packs, source tags)
reference the key, never the name string. Merge of the user's own 550-niche list
(legacy IDs 001–550 preserved, duplicates merged with a log, topics
demoted to sub-niches) + v1 categories: 25 categories, niches and
sub-niches, each category tagged with an **Entity Focus** (PERSON /
PLACE / SUBJECT / EVENT / CREATURE / STORY / ORGANISATION / PRODUCT /
CONCEPT / WORK). Seed only: imported as initial Admin data, fully
editable, not a cap. The Entity Focus tag is what the Bible Registry
Map (next step) uses to assign each niche its proper registry.

Admin can add, edit, reorder, archive, and reactivate **any number** of:

- **Niches** — no maximum number of niches, no minimum sub-niche count
  required to publish, no launch cap. A niche is data, not code:
  `{ name, description, icon?, order, status }`.
- **Sub-Niches** — no maximum per niche. Each: `{ nicheId, name, focus,
  audienceNote, overrides? }`. Users can also create their own custom
  niches/sub-niches in the Website; admin does not edit a user's custom
  entries — this section manages the shared library.
- **Configuration Questions** — no maximum number of questions in total,
  per niche, per sub-niche, or shown in a flow. Questions are defined
  entirely in this panel (route `/questions`) as data (see below).
- **Presets of every other kind** — Tone presets, Visual Style presets,
  Hook styles, Narrative Structure templates, CTA types, Step 17 platform
  patterns. All are dynamic CRUD lists, none are hard-coded in web/admin.

### Dynamic Question Builder (the core of "fully dynamic")

Seed library content: `docs/CONFIG_QUESTIONS.md` (v2) — Layer A
project questions, Layer B run questions, and per-category niche
question packs, de-conflicted from the user's legacy Q1–Q42 set
(each seed question carries its `legacyId`).

Each question is a `ConfigQuestion` record created in Admin:
`{ key (unique, admin-chosen), label, helpText?, scope: global|niche|
sub_niche|workflow_step, nicheId?, subNicheId?, stepKey?, type:
single_choice|multi_choice|short_text|long_text|number|slider|range|
yes_no|date, options[] (for choice types, any number, each {value,label}),
allowCustomAnswer (default true for choice types — "Other, write your
own"; Admin may lock it off only where wording is fixed by law/policy),
customAnswerLabel?,
defaultValue?, required, order, validation (min/max, minLength,
pattern — optional), condition (show only if another question's answer
equals / contains a value — optional), mapsTo: { configFieldPath,
bibleSection?, promptVariable }, status: draft|active|archived,
version }`

Rules:
- Adding/activating a question in Admin makes it appear in the Website
  configuration flow automatically — the Website renders forms from the
  API question schema (§ Web Spec 6), it has no hard-coded question list.
- Changing an active question creates a new version; projects/runs that
  already answered keep their answer + the question version they answered.
- A question, niche, or preset that is in use cannot be hard-deleted —
  archive instead (data integrity, not a usage limit). Every change
  shows "used by N projects" from the API.
- Ordering, grouping, required/optional, and conditional visibility are
  all Admin-controlled per question — no grouping is fixed in code.
- Users keep the value/version they selected even if the library item
  later changes (snapshot on the project, not a live reference).

### Niche-wise Questions List (reusable)

Questions live once in a **Question Library** and are reused per niche —
admin never re-types the same question for every niche.

- Per-niche view (route `/taxonomy/:nicheId/questions`): three groups in
  the order the user will see them: **Inherited Global** questions
  (read-only here), **Niche Questions** (this niche), and **Sub-Niche
  Questions** (grouped by sub-niche). Drag to reorder within each group.
- Two reuse modes when adding a question to a niche/sub-niche:
  - **Assign** — link the library question as-is. Per-niche assignment
    can override only `order`, `required`, `defaultValue`, and grouping.
    Editing the library question updates its version everywhere it is
    assigned (existing answers keep their answered version).
  - **Clone** — copy it into a niche-specific question and customise
    wording/options freely. A clone is independent; library edits do not
    affect it. UI always shows which mode each list item is.
- A question can be assigned to any number of niches/sub-niches
  (unlimited, fully dynamic). The resolved list for a flow is computed
  by the API (Global + Niche + Sub-Niche, by order) — see API §6A.

### Niche Templates (reusable, route `/niche-templates`)

A **Niche Template** is a reusable, versioned bundle for one niche
(optionally refined per sub-niche) that pre-fills a new project/run so
the same setup is never built twice. Unlimited templates; a niche can
have multiple templates (e.g. different formats), one marked Default.

Template sections (each section independently present/absent and
independently applied):
1. **Strategy Defaults** — audience strategy defaults for this niche
2. **Configuration Defaults** — language, Tone Builder values, visual
   style, format/length, narration format, CTA defaults
3. **Production Bible Template** — pre-filled Bible sections used to
   generate the project's Bible draft. Can pre-fill any of the 14 Bible
   sections (API Spec §5) — typically channel promise, tone, language,
   visual, structure, packaging, compliance, plus niche glossary terms,
   research/evidence standards, and music/sound defaults for this niche
4. **Questions Set** — reference to this niche's questions list (above)
5. **Research Template** — research questions checklist, fact types to
   always gather, preferred source types, claim types for this niche
6. **Structure Templates** — one or more narrative/outline structures
   for this niche (hook pattern, section sequence, payoff pattern)
7. **Scene Template** — typical scene/visual type mix, shot patterns,
   on-screen text style for this niche
8. **Audit Add-ons** — niche-specific audit checks added on top of the
   global audit (e.g. date-accuracy for History, disclaimer for Finance).
   Seed example (from the user's Phase 3 file, docs/SCENE_BREAKDOWN.md):
   the Finance add-on pack carries the finance-specific checks —
   revenue≠profit confusion, inflation adjustment on historical
   comparisons, no market-timing implications, no cherry-picked data,
   stock-split annotation, verified-figures-only; the same source's
   100+ term finance glossary seeds the Finance niche's Concept
   Registry + Glossary entries
9. **Packaging Defaults** — title formulas, thumbnail text style,
   description structure, tags approach, default package deliverables

Lifecycle & reuse rules:
- Create: from scratch, **Clone** another niche's template (then edit —
  fastest way to start a new niche), or **Save As Template** from an
  existing project/run setup in the Website (see Web Spec §4A).
- Scope: `global` (admin library, reusable by all projects) or
  `personal` (owner's own library, from Save As Template in Website).
  Both scopes use the identical template shape and apply flow.
- Sub-niche template = niche template + overrides only; resolution is
  niche template → sub-niche overrides → project edits.
- Apply = snapshot copy into the project (template version recorded);
  a template update never silently changes a project that applied it.
  Project Home shows "Template v2 available" diff if admin publishes a
  newer version — re-applying is an explicit user action, per section.
- Draft → Active → Archived, versioned like prompts. In-use templates
  archive, never hard-delete.
- A Niche Template also declares its **active Bible Annexes** (below):
  applying the template turns exactly those annexes on for the project.

### Bible Annex Library (niche-dependent, route `/annex-templates`)

The 14 core Bible sections are identical for all projects. **Annexes are
the niche-dependent extra Bible sections** — managed here as templates:
- Built-ins: `monetizationSponsor` and `accessibility` (any niche,
  activated per project/niche), `character` (person-based niches only:
  life documentary, biography, kings/figures — **portrayal rules +
  invented-dialogue policy only since A12**: character DATA — entries,
  locked appearance descriptions, life timelines, relationships —
  lives in the project's Character Registry, whose canonical type is
  defined in the Registry Type Library; Bible versions snapshot it.
  The annex template therefore defines rules fields only, and the
  seed character-annex template's former data fields are retired in
  favour of the registry type).
- Subject annexes for non-person niches are separate templates, e.g.
  Ayurveda/wellness gets an ingredient/herb registry + health-claim
  boundaries + disclaimer annex; Geography gets a place/region registry
  + map/naming standards annex. Admin can create an annex template for
  **any** niche with its own dynamic fields — the annex list is data,
  not code, and there is no limit on annex templates per niche.
- Annex templates are versioned/draft-active-archived like all
  templates; a project only ever sees its active annexes.
- **Chart-type vocabulary (D4):** the `dataVisualization` annex
  template carries the platform's chart-type vocabulary — each
  type with its required `dataVizSpec` fields and validation rules
  (schema: docs/SCENE_BREAKDOWN.md). Admins add/extend types here;
  the vocabulary is versioned, runs snapshot the version they used,
  and unsupported-type requests from scenes (`dataVizRequest`)
  arrive in this library's review queue.
- **Bible file mapping (docs/BIBLE_FILE_MAPPING.md):** the user's 39
  Bible files are mapped into the layered Bible; Admin seeds from it:
  the Data Visualization annex template, and the default Step 12
  audit checklist set (Accuracy, Bias Prevention, Editorial Depth,
  Originality — user files 03/14/23/29) as audit templates.
  **Content-verified additions (docs/PHASE2_ADDITIONS.md, G1–G10)**
  extend the platform audit checks (continuity taxonomy, external
  originality standard, beat coverage, prompt-smuggling), the
  registry entry schemas (variants, state tables, camera geography)
  and the Accessibility annex template (safe area, colour-
  independent labels) seeded here.
- **Visual Style Library (docs/VISUAL_STYLE_SYSTEM.md):** 16 visual
  archetypes as versioned Admin presets with full archetype CRUD
  (create/edit/version/archive, like the annex template library —
  archetype-first system —
  niche → archetype + overrides mapping, no per-niche style rows);
  Niche Template Bible section references archetype + default
  overrides for its niche. **Dual-archetype rows (D5):** the
  mapping editor supports primary + secondary archetypes and shows
  the **resolved field values with their per-field source**
  (primary/secondary/union/default) so conflicts are visible and
  correctable; the field-owner assignments themselves are editable
  here (documented configuration — Graphics is assigned to the
  secondary group by default); rows flagged ambiguous in the seed's
  dualMappingReview appear with a review badge until an Admin/user
  decision resolves them.
- **Registry Map (docs/REGISTRY_MAP.md):** Admin holds the Registry
  Type Library (**11 types** — character, place, knowledge, caseEvent,
  creature, storyWorld, organisation, product, concept, work,
  propsWardrobe — dynamic
  fields like annex templates) and per-niche **Angle management**
  (Angle = question/scope/evidence/boundary, versioned; full CRUD —
  an angle used by any run is **archived, never deleted**, so run
  snapshots stay resolvable). **Title-only angles (2026-10-27):**
  the 17,069 angles seeded from the user's ANGLES_MASTER.md carry
  titles only and are badged **"Title only"** in every Admin list
  and editor until an admin fills question, scope, evidence and
  boundary (all four -> the badge clears and `completeness`
  becomes complete). The editor offers **AI draft suggestions**
  for the empty fields, stored as labelled drafts
  (`suggestedFields`, status draft) — a suggestion is never
  approved guidance until an admin applies it by editing the
  field, and applying is recorded as a normal admin edit. A Niche
  Template gains a 10th section, **Registries**, assigning the
  primary + secondary registry types for its niche per the Registry
  Map (category defaults + per-niche overrides). **A8 shape:** the
  section is either **Inherit** (default — the niche resolves from
  its per-niche override if one exists, else the category map) or
  **Explicit** (`primary` + `secondary[]`, where an empty secondary
  list is an intentional choice, shown differently from Inherit).
  The editor shows the *resolved* set with its source (category /
  niche override / this template) before saving; switching back to
  Inherit clears the override. Saves are validated (valid registry
  types only, no primary-in-secondary, no duplicates — API §6A);
  ambiguous assignments are flagged for review, not guessed.
  Templates created before this section existed simply show Inherit
  — their other sections are never rewritten by this.
- Niche Templates may also seed **Bible Master List** starter entries
  (e.g. an approved source list or phrase bank for the niche); the 7
  Master Lists themselves are project-level living registries (API
  Spec §5) — Admin defines no caps on entries.

### Source Library & Research Coverage (A1 — docs/RESEARCH_SOURCES.md)

Research is **curated sources first**; this page (`/source-library`)
is where curation happens.

- **Library entries:** full CRUD on the API §6B entry shape (name,
  URL, kind incl. scripture/translation/commentary, language,
  author, publisher, edition, scope single-page/site-section/
  whole-site, category/niche links, multi-topic tags, credibility
  credibility tier 1–5 (or unassessed), availability
  enabled/disabled/inaccessible, review status
  approved/pending/blocked — shown as three separate fields, A5).
  Entries flagged `needs_tier_review` (migrated records whose tier
  was never assessed) are filterable here. Duplicate warnings on add (normalised URL,
  near-duplicate title). Every change lands in the entry's review
  history. Link-check results are shown here (`lastCheckedAt`,
  inaccessible entries flagged).
- **Starter bundles:** build named, reusable source sets for
  priority niches/topic clusters; a bundle must be marked **reviewed**
  before it can be applied to niches or projects; Niche Templates
  may reference a bundle.
- **Niche coverage board:** every niche shows `not_assessed |
  needs_sources | partial | ready`. **Ready is a reviewed judgment**
  (reviewer, date, note) — the UI never derives it from URL counts.
  The board is sortable by run usage and by the **gap log** (research
  gaps and insufficient-evidence outcomes recorded per niche), so
  curation follows the gaps users actually hit.
- **Web-discovery review queue:** web-discovered sources from runs
  platform-wide, with the run/project context and the passage that
  was verified; actions: promote to the global library (enters as
  review status `pending`; Admin then sets its credibility tier and
  review decision), or block platform-wide. Project-level approval stays with
  the project owner (Web app).
- **Web fallback module settings:** which web-research mechanism is
  enabled (dedicated search provider / LLM native search / hybrid)
  — rules for when it may run live in API §6B/Step 7 and cannot be
  loosened from here: `curated_first` always asks the user first.

## 9. Prompt & Model Configuration (super_admin)

- One prompt template per pipeline generation step (topics, topic
  scoring assist, research, bible draft, outline, script section, scene
  plan, narration, visual prompt, each audit area, fix/revision,
  package text items, optional 16/17, performance insights).
- Per template: system prompt, user prompt template with named variables
  (variables are validated against `packages/shared` — unknown variable
  = publish blocked), model assignment, temperature/params (within API
  allowed ranges), version history, draft → test → publish flow.
- Test run: run a draft prompt against a selected sample project/run
  snapshot, view output side-by-side with current published version.
  Test runs are logged and cost-tracked separately, never charged to a user.
- Publish is super_admin only, requires a change note, and API keeps the
  previous published version for instant rollback (one click in UI).
- Secrets/API keys are **never** shown or edited in this UI — keys live
  in API environment/secret storage; admin UI shows only provider +
  masked status (connected / missing).
- **Model Providers (docs/MODEL_PROVIDERS.md):** a provider registry
  with built-in presets — OpenAI, Anthropic (Claude), Google
  (Gemini), xAI (Grok), Zhipu (GLM), Moonshot (Kimi), DeepSeek,
  Alibaba (Qwen), Meta (Llama, hosted), Xiaomi (MiMo), MiniMax —
  plus **custom OpenAI-compatible endpoints**. Each provider has a
  model catalogue (context window, JSON/vision support, cost tier);
  each pipeline **stage** is assigned a provider+model with an
  ordered **fallback chain**. Keys live only in the server `.env`
  (named per provider); the UI offers enable/disable + **Test
  connection** and shows masked status only. The stage-assignment UI
  warns when an audit stage is assigned the same model that drafts
  (audit independence). Niche Templates may override stage
  assignments; runs snapshot the models actually used (Generator
  Profile).
- **Embeddings & similarity (A2, docs/MODEL_PROVIDERS.md §5):** the
  catalogue also holds `modelType: embedding` models (dimensions,
  languages — the assigned model must be multilingual, Hindi +
  English included), and the assignments include the single
  **embedding assignment**. This page carries the **similarity
  thresholds** — separate values for topic dedupe, Do-Not-Repeat
  matching and originality — with the calibration date shown
  (defaults stay *provisional* until calibrated on representative
  Hindi/English pairs). Changing the embedding model surfaces a
  **Re-index** action (scope: all / project / entity type) with
  progress + stale-vector counts; provider outages show as
  `semanticStatus: unavailable` in monitoring, never as silent
  passes.

## 10. Plans & Credits

- Plans CRUD: name, reference price (informational only — there is
  NO billing provider and nothing is sold in-app), included credits,
  optional modules access, status (draft/active/archived). Plans must
  NOT cap projects, runs, niches, sub-niches, topics, or questions —
  fully dynamic / no limits (§8). Changing a plan does not
  retro-change existing plan members unless an explicit, logged
  migration action is run (super_admin).
- Credit packs are **admin grant bundles** (credits amount, status)
  — a one-click way to grant a standard amount; they carry no price
  and no checkout.
- Credit ledger view (platform-wide + per user filter): type
  (purchase, grant, generation_charge, refund, admin_adjustment),
  amount, related job/run, created by/at. Ledger is read-only in UI.
  (`purchase` entries can only occur if a billing provider is added
  later; today all credits enter via grant/adjustment.)
- Refunds are **credit restorations** recorded by an admin as a
  ledger adjustment with a reason (e.g. a failed job that was
  charged); there is no payment provider and no money refund flow.

## 11. Feature Flags & Optional Modules

- Flags list: key, description, current state (on/off), scope
  (global / plan / specific users), updated by/at.
- Managed flags at minimum: `module_visual_asset_research` (16),
  `module_publishing_optimization` (17), `performance_csv_import`,
  `brand_projects`, `new_prompt_<step>` rollout flags.
- UI warns when turning off a flag that active runs depend on
  (API returns dependent-run count); turning it off never breaks an
  in-progress run — it blocks new starts (API enforces).

## 12. Content Safety Queue

- Items: claims/sources flagged by audit (unsupported claim, invented
  source suspicion), banned-word/topic hits in generation, user reports.
- Item view: run/project context, exact scene/claim, audit evidence,
  source trace. Actions: add note, escalate, restrict a generation
  category for a user (logged, reason required), dismiss as reviewed
  (does not edit user content). Admin never rewrites a user's claim to
  "verified" — only the Research/Audit flow can verify (Control Rule 9).

## 13. Platform Performance Insights

Aggregated, anonymised Step 15 data: avg CTR / retention / AVD by
niche, sub-niche, hook style, structure template, video length band.
Purpose: improve presets, topic scoring guidance, and Bible defaults.
No individual user's channel credentials are ever shown here —
performance data arrives via the YouTube OAuth sync (API Step 15)
or manual entry/import in the Website app; OAuth tokens stay
encrypted in the API and are never exposed to Admin.
- **YouTube connection health (A10):** aggregate counts of user
  channel connections by state — healthy, `reauth_required`,
  `quota_exceeded` — so platform-level OAuth/quota problems are
  visible here; individual tokens are never shown (they are stored
  encrypted by the API and never returned).

## 14. Logs

- **Admin Audit Log:** every admin action (who, role, action, target,
  reason, before/after summary, timestamp, IP). Immutable, filterable,
  exportable (CSV) by super_admin.
- **System Log view:** API job failures, webhook failures, export
  failures — read-only, with link to related run/job. Full infra logs
  stay in infra tooling; this is the operational subset from the API.

## 15. Settings

- Admin Users: create/remove admin accounts, role assignment,
  password reset (super_admin only; A9 bootstrap model — accounts
  are DB records with hashed passwords; the bootstrap .env login is
  for setup/recovery only and is identified as `bootstrap` in the
  audit log, never managed from this screen).
- Platform defaults: audit pass threshold, script duration tolerance,
  scene word-count guidance range, job concurrency/retry display.
  There is deliberately NO setting for max niches / sub-niches / topics /
  questions — those are unlimited and fully dynamic (§8).
- All settings changes are versioned + logged with before/after values.

## 16. Global Admin UX Rules

- Destructive or money/credit-affecting actions always: confirm dialog
  + mandatory reason field + success toast linking to the log entry.
- Every list supports search/filter/pagination via API (no client-side
  filtering of a full dataset).
- Empty/loading/error states on every screen; a failed API call never
  renders as "0 results".
- Admin UI shows data freshness (last updated) on dashboard aggregates.

## 17. Acceptance Criteria (Admin)

- An admin can find any user/project/run in ≤3 clicks from search, see
  its exact pipeline stage and audit status, and retry a failed job —
  without database access.
- No admin screen offers a way to: skip a stage gate, approve for a
  user, verify an unverified claim, or edit a credit balance directly.
- Every config publish (taxonomy, prompt, plan, flag, setting) is
  versioned, attributed, and reversible from the UI.
- An admin can add a brand-new niche, sub-niche, preset, or configuration
  question in this panel and see it usable in the Website flow with no
  code change, no deploy, and no count limit blocking it.

## 18. Open Decisions

- ~~MFA provider/method for admin, and whether IP allowlist is required.~~ Resolved 2026-10-27: neither — admin credentials live in the server `.env` (personal project).
- ~~Whether `support` role ships in MVP or later.~~ **Resolved
  2026-10-27:** NOT in MVP — admin-only.
- Data retention period for logs and deleted accounts (policy decision,
  API enforces).

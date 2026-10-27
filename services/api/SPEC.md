# API Spec — services/api

Single backend for `apps/web` and `apps/admin`. Owns: auth, all workflow
data, the stage-gate state machine, async AI generation jobs, credits,
exports (Production Package), and admin operations.

Stack-neutral contract spec. Recommended: TypeScript (shared types with
`packages/shared`), REST/JSON, PostgreSQL, Redis-backed job queue,
object storage for exports. Behaviour below must hold regardless of stack.

Base: `/api/v1` · Auth: Bearer JWT (user) / admin JWT with role claims ·
All timestamps ISO-8601 UTC · IDs are opaque UUIDs · Lists are cursor
paginated (`?cursor=&limit=`, default 25, max 100) · Every response uses
the envelope in §2.

## 1. Core Concepts

- **WorkspaceProject** — Personal or Brand faceless channel project.
  Holds Steps 1–3 strategy, Step 6 config defaults, Step 8 Bible versions.
- **WorkflowRun** — one video inside a project. Holds Steps 4–15 (+16/17)
  state, artifacts, approvals, `openIssues[]`.
- **StageGate state machine (§4)** — the only authority on whether a step
  can start/complete. Web and Admin render its output; they do not re-implement it.
- **Job** — every AI generation is an async Job. Clients poll or receive
  webhooks. No generation happens inside a normal CRUD request.
- **Versioned artifacts** — Bible, Outline, Script, SceneSet, AuditReport,
  Package are immutable versions; "current" is a pointer on the Run/Project.

## 2. Conventions

Success: `{ "data": <object|list>, "meta": { "cursor": "...", "hasMore": true } }`
Error: `{ "error": { "code": "STAGE_LOCKED", "message": "...", "details": {} } }`

Standard codes: `UNAUTHORIZED 401`, `FORBIDDEN 403`, `NOT_FOUND 404`,
`VALIDATION 422` (with per-field details), `STAGE_LOCKED 409`,
`APPROVAL_REQUIRED 409`, `INSUFFICIENT_CREDITS 402`,
`JOB_ALREADY_RUNNING 409`, `RATE_LIMITED 429`, `INTERNAL 500`,
`EMAIL_NOT_VERIFIED 403` (§3 gate), `ACCOUNT_SUSPENDED 403`
(suspended account — §3/D3), `SAMPLE_READ_ONLY 403`
(the read-only sample project, §3), `FEATURE_DISABLED 403`
(feature-flagged module off, §6C), `POSSIBLE_DUPLICATE 409`
(topic/Do-Not-Repeat dedupe hit — the response carries the matches
and scores; proceeding requires the explicit continue-anyway
confirmation, §6A Step 4–5).

Rules:
- Validation errors name the exact fields; stage errors name the blocking
  step + missing artifact/approval.
- Generation endpoints return `202 { jobId, estimatedCredits }` after a
  prior **estimate + confirm** (§7). They never charge on failure.
- Mutations that create a new version return the new version id + number.

## 3. Auth & Users

| Method & Path | Notes |
|---|---|
| `POST /auth/signup` , `POST /auth/login` , `POST /auth/logout` | Email + password (hashed, never returned) |
| `POST /auth/forgot-password` , `POST /auth/reset-password` | Token via email, single-use, expiring |
| **Password rules (D2 — identical at signup, reset, and settings change)** | Minimum **10 characters**; a strength score is computed server-side (the client meter mirrors it) and very weak passwords are rejected `422`. Every new password is checked against a breached-password corpus via a k-anonymity range lookup (only a hash prefix leaves the server; the password itself never does). A breached hit → rejected with a clear message. **If the breach check is unavailable**, the password is accepted on the length/strength rules, the skipped check is logged, and the response carries `breachCheck: unavailable` so the client can show a notice — the flow never dead-ends on the check. A successful reset or password change **revokes all other sessions** for the account |
| **Sample project (D2)** | A platform-owned project flagged `isSample: true`, readable by every authenticated user (labelled sample everywhere). Job creation and all mutations against it → `403 SAMPLE_READ_ONLY`. `POST /projects/sample/duplicate` copies it into the caller's workspace as a normal owned project (data copy only — no credits, no jobs run) |
| `GET /auth/verify-email/:token` | Email verification |
| `POST /auth/resend-verification` | Re-sends the verification email for the caller's unverified address (rate-limited; always `200` whether or not the address exists/verified — no account enumeration) |
| `GET /me` , `PATCH /me` | Profile, default language, notification prefs |
| `GET /me/credits` | Balance + plan summary |
| `GET /me/credits/ledger` | Paginated ledger (purchase/grant/charge/refund/adjustment) |
| `DELETE /me` | **Account deletion.** Body `{ password }` (re-authentication required; wrong password → `403`). Schedules deletion (see below) and immediately revokes all sessions/tokens |

**Transactional email (required infrastructure, §10):** verify and
password-reset mail is sent through a provider configured **only**
via server `.env` (provider-agnostic: SMTP or API-based; credentials
in env, never in DB, responses or logs). Templates: `verify_email`,
`password_reset`. Tokens are single-use, expiring (verify 24h, reset
1h), and stored **hashed** (`EmailToken`); a new token invalidates
previous ones of the same purpose. **Failure states:** send failure
→ the token stays valid and delivery retries from a queue; signup /
resend / forgot-password responses expose a user-visible
`emailStatus: sent|queued|delayed` once retries are exhausted the
client shows "email delayed — request again later"; there is no
silent dead end and no flow blocks on mail delivery itself.

**Verification gate (A10 open item — RESOLVED 2026-10-27, user
decision):** email verification gates **cost-incurring actions
only**. An unverified user may register, log in, browse, create and
manually edit projects/runs, upload files, connect YouTube, export
their data, and use every screen needed to complete verification.
**Restricted** (verified email required): every user-triggered job
that spends credits or calls a paid provider — all generation jobs
(topic generation/scoring, research incl. web fallback, Bible
draft, outline, script, scenes, narration, visual prompts, audit,
auto-fix, package generation, Steps 16/17 generation, performance
insights), embedding/similarity jobs, and any future job class with
provider cost. **Enforcement is server-side** at job creation:
unverified → `403 EMAIL_NOT_VERIFIED` (with a resend affordance in
the payload), checked **before** any credit estimate, hold or
provider call — no credits are ever deducted and no job is started
for an unverified user. **Resend limits:** 60-second cooldown, max
5 resends per account per day (platform settings), on top of the
anti-enumeration behaviour above. **Expired link:** the verify
endpoint returns an `expired` state (not an error page) and the
client offers resend; a used token returns `already_used`. Events
(`verification_sent`, `verification_resent`, `verified`,
`verification_expired_attempt`, `restricted_action_blocked`) are
recorded with the account + timestamp — **token values are never
logged** (hash references only). **A9 independence:** admin auth
(bootstrap + AdminUser) never depends on this gate or on the email
provider — admin password resets are performed by a super_admin (or
the bootstrap login) inside Admin, so setup and recovery remain
fully usable during an email outage. There is **no equivalent
bypass for ordinary users**: during an outage their restricted
actions stay restricted, with the `delayed` status shown.

**Account deletion lifecycle:** `DELETE /me` sets account status
`pending_deletion` and starts a **30-day grace period** — all
sessions and API tokens are revoked immediately (the deletion
request itself is the last authenticated action), the account can
no longer call the API, but the user can **cancel by logging in**
during grace (`POST /auth/login` on a `pending_deletion` account
returns `accountStatus` + a cancel-deletion prompt; cancelling
restores full access). After grace, a deletion Job **hard-deletes**:
projects, runs, all artifacts and packages, uploads and their stored
files, YouTube connection tokens, webhook subscriptions, source/
research data. Rows that must be retained for integrity are
**anonymised, not kept with content**: `CreditLedger` and audit rows
keep amounts/codes with `userId` replaced by a `deleted-user`
marker; `AdminAuditLog` entries are platform records, not user data.
**Failure state:** if the deletion Job fails part-way, the account
enters `deletion_failed` — nothing is silently half-deleted: the Job
is idempotent and retries, the state is visible to Admin (§9 user
detail), and the user is notified by email; hard delete completes or
the account stays whole in `deletion_failed` until an admin retries.

Admin auth is separate (**bootstrap model — A9, Admin Spec §2**):
`POST /admin/auth/login` verifies against **`AdminUser` records**
(hashed passwords, per-user role claims `admin|super_admin`,
server-side role enforcement on every `/admin/*` action, individual
attribution in `AdminAuditLog`). One **bootstrap super-admin**
credential from the server `.env`
(`ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD`) is accepted
only while no AdminUser exists or for recovery; its sessions are
short-lived, its actor is recorded as `bootstrap`, and rotating the
.env values + restart invalidates its sessions. Login is
rate-limited with lockout/backoff. MFA is not required (personal
deployment) but the flow reserves a second-factor step and
AdminUser has nullable MFA fields for later. Credentials are never
returned by any endpoint, logged, or seeded. Admin tokens cannot
call user workflow mutations as the user; user tokens cannot call
`/admin/*`.

## 4. Stage-Gate State Machine (Control Rules 1, 5–8, 11)

Run stages in master order (enum in `packages/shared`):

```
TOPIC_LIST → TOPIC_EVALUATION → CONFIGURATION → RESEARCH →
BIBLE_CONFIRM → OUTLINE → SCRIPT_DRAFT → SCENE_BREAKDOWN →
AUDIT → REVISION → PACKAGE → PERFORMANCE
(+ optional: ASSET_RESEARCH — attaches before PACKAGE;
 PUBLISHING_OPT — runs after REVISION: generated before PACKAGE its
 outputs join the package, generated after they attach as a package
 addendum and mark it `outdated` only if the client wants them in
 the ZIP — §6C governs; an earlier draft of this line contradicted
 §6C and is corrected here)
```

Per-stage status: `locked | ready | in_progress | awaiting_approval |
done | failed | needs_revision`.

Transition rules (enforced on every Run mutation):
- A stage can move `ready → in_progress` only if the previous dependent
  stage is `done`.
- Approval stages (`TOPIC_EVALUATION` selection, `RESEARCH` approval,
  `OUTLINE` approval, `REVISION` final approval) require an explicit
  `POST .../approve` by the Run owner. No job or admin action can
  approve. **Brand approval (D1):** Brand projects add a script-level
  approval state (Draft → In Review → Changes Requested → Approved →
  Final) moved only by the **brand owner** via
  `POST /runs/:runId/brand-approval { to, note? }` (Brand projects
  only; Changes Requested requires a note; Final locks the version).
  In MVP the owner is the approver (solo self-review) and every
  transition is written to the script's approval history (actor,
  timestamp, note). Member roles (editor/approver) are future work —
  no endpoint accepts another user as a Brand actor in MVP.
- `BIBLE_CONFIRM` completes in exactly one of two ways (B-sweep fix —
  it previously could never complete when no newer Bible existed):
  if the project Bible has **no** newer approved version than the
  run's snapshot, the stage auto-completes (system transition,
  recorded in the stage history) when the run reaches it; if a newer
  version **does** exist, the stage waits `awaiting_approval` until
  `POST /runs/:runId/bible/confirm` records `acceptVersion` or
  `keepSnapshot`.
- `AUDIT` must be `done` (with a report) before `PACKAGE` can start.
  `PACKAGE` additionally requires `REVISION` final approval, **or** a
  recorded override: `{ override: true, note }` + all unresolved audit
  failures copied into `openIssues[]` and into the Package manifest.
- A substantial edit to an approved artifact (script, scenes, outline)
  moves dependent stages back: script/scene edit → `AUDIT = needs_revision`,
  `PACKAGE = outdated`; outline edit → `SCRIPT_DRAFT..PACKAGE = needs_revision`.
  API computes and returns the new stage map; clients just render it.
- Failed job → stage `failed` with `lastError`; retry creates a new Job,
  never mutates the failed one.

Project-level gates: a Run cannot be created unless the project has
≥1 niche, ≥1 sub-niche, completed audience strategy, and an **approved**
Bible version.

## 4A. Lifecycle — Archive, Delete, Drafts, Suspension (D3, resolved 2026-10-27)

Archive-first lifecycle for projects and runs (`LifecycleStatus`:
active | archived | pending_deletion | deleted). **No conflict
with the A10 account-deletion rules** — this is the same 30-day
pattern applied per item; account deletion still purges everything
at the account level.

- **Archive** (`POST /projects/:id/archive`, `POST
  /runs/:runId/archive`; restore via `.../restore`): owner-only.
  Archived items are **read-only** (mutations → 409), excluded from
  default active lists, and visible in an Archived view. Archiving
  **never refunds, alters or erases credit/ledger history** — past
  charges stand exactly as recorded.
- **Delete** (`DELETE /projects/:id`, `DELETE /runs/:runId`):
  owner-only, with a confirmation that names what will be removed.
  Deletion is **soft for 30 days** (`pending_deletion`, restorable
  by the owner via `.../restore`); after 30 days a purge job
  permanently deletes the item's data: artifacts, Bible versions
  (projects), registries/lists (projects), package files, uploads
  attached to it, and its generated exports. **Retained after
  purge:** the owner's credit-ledger entries (account financial
  records — they keep their job/run references as plain ids), and
  platform AdminAuditLog entries. Do-Not-Repeat entries a deleted
  run's package created **remain** in the project list (their
  source ref is marked "deleted run") — anti-repeat protection is
  project knowledge, and the owner can remove entries manually.
  Already-downloaded export ZIPs are the user's own copies and are
  unaffected. Permanent deletion is complete when the purge job
  finishes and storage objects are deleted; copies inside platform
  backups expire with normal backup rotation and are never
  restored except in a full disaster recovery.
- **Active jobs:** archiving or deleting an item **cancels its
  queued jobs** (holds fully released) and **cancels running jobs
  at the next unit boundary** — completed units are charged at
  actual cost and partial results kept, per §7; no new job can
  start on an archived or pending-deletion item (409). Restoring
  an item never auto-restarts jobs; the user retries explicitly.
- **Wizard drafts** (project-creation and run-creation): a draft
  records `lastSavedAt` + `expiresAt`; **30 days of inactivity
  auto-expires the draft** (draft data only — nothing else is
  touched). The UI shows both timestamps with Resume and Discard
  actions.
- **Retry:** any stage whose job failed (or whose stage sits in
  `failed`/`needs_revision`) can be retried from that stage via the
  normal estimate + confirm flow — the estimate is shown before
  confirming, per-unit charging applies, and completed units are
  never charged twice (§7).
- **Suspended accounts:** suspension (Admin §5) blocks API access
  (`403 ACCOUNT_SUSPENDED`) without deleting anything. Queued jobs
  are cancelled (holds released) and running jobs cancel at the
  next unit boundary (§7 rules); all work remains intact and fully
  accessible again on reactivation. The user's only screen while
  suspended is the suspended state (Web §3B) with the platform
  contact path.

## 5. Projects, Strategy, Bible (Steps 1–3, 6, 8)

| Method & Path | Notes |
|---|---|
| `POST /projects` , `GET /projects` , `GET /projects/:id` , `PATCH /projects/:id` , `DELETE /projects/:id` | Type: `personal|brand`. Delete = soft delete + export grace period |
| `POST /projects/:id/export` , `GET /projects/:id/exports/:exportId` | **Owner-only** (403 otherwise — exports contain the whole project). Job → ZIP in object storage: project configuration + config answers, **all Bible versions** + annexes, master lists, registries, source list, and every Run's artifacts (topics, research brief + claims/sources, outlines, scripts, scenes, audit reports, certificates) + package manifests (package files referenced by manifest + checksums, not re-zipped). Delivered via signed URL (≤ 1h, §10). Export record: `status: pending|ready|expired|failed` (+ `error?`); a failed export Job can be re-requested, never returns a partial ZIP as `ready` |
| `GET /projects/:id/summary` | Dashboard aggregate: strategy status, Bible version, topics/runs counts, credits used |
| `PUT /projects/:id/niches` | Replace niche list. Niche: `{ id, name, source: preset|custom, presetId? }` |
| `POST /projects/:id/niches/:nicheId/sub-niches` , `PATCH/DELETE .../:subId` | SubNiche: `{ name, focus, audienceNote, overrides? }` (overrides = partial Tone/Language/Visual/Structure) |
| `GET/PUT /projects/:id/audience-strategy` | Step 3 object (§ Data Model) |
| `GET/PUT /projects/:id/configuration` | Step 6 defaults object: length, platform, format, storytelling style, narration format, tone, language, visual style, CTA, output requirements (required package deliverables[]) |
| `POST /projects/:id/bible/generate` | Job → Bible draft from strategy + config |
| `GET /projects/:id/bible` , `GET /projects/:id/bible/versions` , `GET .../versions/:v` | Current + history |
| `PATCH /projects/:id/bible/versions/:v` | Edit a *draft* Bible only; approved versions are immutable |
| `POST /projects/:id/bible/versions/:v/approve` | Locks version, sets it current |
| `GET /projects/:id/bible/proposed-edits` | Proposed Bible edits (`ProposedBibleEdit[]`): `{ id, source: performance_insights, sectionKey, changeSummary, rationale, evidenceRefs[], status: pending|approved|rejected, createdAt, decidedAt?, decidedBy? }`. Created only by the Step 15 insights flow — the API never writes insights into a Bible directly |
| `POST /projects/:id/bible/proposed-edits/:editId/approve` , `POST .../:editId/reject` | **Owner decision.** Approve applies the edit as a **new Bible version** (existing rule: §14 Performance Learnings Log and all Bible changes land only via approval — the new version goes through the normal approve flow before it becomes current); reject records the decision with an optional note. Acting on a non-`pending` edit → `409` |

**Production Bible sections (14 — canonical list, also in `packages/shared`):**
a Bible version's `sections` object has exactly these keys, each a
structured object (not free-text blob):
1. `channelPromise` — objective + niche/sub-niche map
2. `audiencePersona`
3. `toneBible` — tone, persona, pacing, sentence style, do/don't examples
4. `languageBible` — language, level, slang, use/avoid words, number/date/name handling
5. `visualBible` — visual style/mix, mood, pacing, per-scene-type rules, on-screen text, image prompt style suffix
6. `structureBible` — structures by format, hook formulas, retention + CTA rules
7. `packagingBible` — title formula, thumbnail text, description, tags
8. `complianceBible` — banned topics/claims/words, disclaimers, fact rule, copyright caution
9. `voiceNarrationBible` *(added 2026-10-27)* — voice profile (text instruction for external VO/TTS), speaking rate (WPM by format), pause/emphasis rules, reading numbers/dates/quotes, energy curve. Plus **per-character voice specs** keyed by character ID (delivery, timbre, pace, emotional range) for dialogue content, and the **voice-imitation boundary**: a proposed voice direction is not authorisation to imitate a living performer — voice references require recorded consent/usage evidence (docs/PHASE2_ADDITIONS.md G7). Consumed by Script Drafting + Package VO Instructions
10. `glossaryPronunciation` *(added 2026-10-27)* — growing registry: `{ term, spelling, definitionSimple, pronunciationPhonetic?, explainOnFirstUse, bannedSynonyms[] }` for niche terms + people/place names. Consumed by Research, Language Audit, narration
11. `musicSoundBible` *(added 2026-10-27)* — music genre/mood per section type, intensity rule, SFX palette, silence rule, music-under-narration rule, banned sounds. Consumed by Scene Breakdown music/SFX cues
12. `seriesContinuityBible` *(added 2026-10-27)* — intro/outro templates, recurring segments, catchphrases, character/world registry, continuity log, callback + watch-next rules. Consumed by Outline + Continuity Audit
13. `researchEvidenceStandards` *(added 2026-10-27)* — preferred source hierarchy per niche, minimum source expectation per claim type, conflicting-fact handling, uncertainty wording patterns, recency rules, citation style. Defaults include the verification standard (1 primary or 2 independent sources for hard facts) and the **cautious-language standard**: unproven wrongdoing is worded as allegation/charge/report ("was accused of", "was charged with"), never stated as fact (docs/PHASE1_RESEARCH_REVIEW.md). Consumed by Step 7 Research + Fact Audit
14. `performanceLearningsLog` *(added 2026-10-27)* — living annex of **approved** learnings only: hook patterns worked/failed, retention patterns, best structure/length per sub-niche, title/CTR patterns, repeat/avoid topics. Written only via the Performance insights approval flow (§ Step 15) — it creates a new Bible version, never a silent edit

**Bible Annexes (`sections` above are the same 14 for every project;
annexes are extra, niche-dependent — added 2026-10-27):**
A Bible version also carries `annexes[]`: `{ annexTemplateId,
annexTemplateVersion, key, data }`. Only annexes **active** for the
project appear in the Bible editor, are injected into prompts, and are
audited — inactive annexes simply do not exist for that project.
Built-in annex templates (shipped as data, editable like all templates):

- `monetizationSponsor` — available to all niches, active when the
  project monetises: sponsor segment format + placement rules,
  disclosure text templates (ad/sponsor/affiliate), product/affiliate
  mention rules, claims allowed for sponsors, advertiser-friendly
  content boundaries, mid-content break points. Consumed by Script
  Drafting (sponsor segments) + Compliance Audit.
- `accessibility` — available to all niches: on-screen text readability
  (minimum display time by word count, plain-language rule), caption
  line length + reading-speed rules, contrast guidance for text over
  visuals, visual-description clarity for key information (never put
  essential facts only in tiny on-screen text), **safe area** for
  on-screen text and **colour-independent labels** (pattern/shape
  encoding — meaning never carried by colour alone). Consumed by Scene
  Breakdown + Visual/Accessibility audit checks.
- `character` — **person-based niches only** (life documentary,
  biography, kings/historical figures, person-led stories). **Since
  A12 the annex holds portrayal RULES only:** portrayal rules and
  the dialogue policy — invented dialogue is dramatization, must
  be labelled as such and never presented as a verified quote
  (Control Rule 9). **Character DATA lives in the project's
  Character Registry** (RegistryModule, REGISTRY_MAP Type 1 — the
  canonical `CharacterEntry` shape; the old annex field
  `appearanceLockedDescription` is retired in favour of
  `lockedAppearanceDescription`). **Snapshots:** when a Bible
  version is created/locked and the project's registry set includes
  character, the version captures an immutable `characterSnapshot`
  of **all** current Character Registry entries (entryId +
  entryVersion + full data). Editing the living registry never
  alters a locked version or a past run: a run records its
  `bibleVersionId`, the snapshot id, and the entry versions its
  scenes actually referenced. **Drift:** `GET
  /projects/:id/bible/versions/:v/character-drift` returns entries
  changed, added or archived since the snapshot; including them is
  deliberate — it creates a new Bible draft version (via the
  proposed-edits flow) with a fresh snapshot, never an in-place
  edit. **Migration (pre-A12 projects):** character data stored in
  annex JSON is copied into the registry once; where the same
  character exists in both homes with differing fields, both copies
  are preserved and the pair is flagged in a `migration_conflicts`
  list for the user to resolve — nothing is silently discarded or
  merged. Consumed by Research, Outline, Script, Scene Breakdown
  (the snapshot's locked appearance is appended to every AI image
  prompt for that character), Continuity + Fact Audit.
- Niche-specific **subject annexes** — non-person niches do NOT use the
  Character annex; they get their own subject annex template, e.g.
  `subjectKnowledge` for Ayurveda/wellness: ingredient/herb registry
  `{ name, otherNames[], claimedProperties, verifiedNotes,
  safetyWarnings }`, remedy format standards, health-claim boundaries
  (no cure/treatment claims), mandatory medical disclaimer, concept
  (e.g. dosha) definitions. Or `placeRegion` for Geography: place
  registry `{ canonicalName, localName, pronunciation, hierarchy }`,
  map standards, units rule, disputed name/border neutral-naming rule,
  terrain/climate terminology. These two are examples shipped as
  templates, **not a fixed list** — Admin can create an annex template
  for any niche with its own fields (dynamic field definitions, same
  pattern as ConfigQuestion), and a Niche Template assigns which annex
  templates are active for that niche/sub-niche (Admin Spec §8,
  API §6A).

**Bible Master Lists (added 2026-10-27) — 7 living registries that live
WITH the Bible but, unlike its 14 sections, are NOT locked inside a
Bible version:** they grow video after video, so they are project-level
registries with per-entry history; a Run **snapshots the entries it
used** (same snapshot discipline as config/Bible). Entries are
unlimited; a Niche Template may seed starter entries.

1. `sourceList` — `{ name, kind: book|archive|site|journal|channel|document,
   ref, credibilityTier: 1–5|null, reviewStatus: approved|pending|blocked,
   scope, note }` (A5 field model, docs/RESEARCH_SOURCES.md: credibility
   and the review decision are separate fields; tier 5 = do-not-use,
   blocked in every scope; this entry's reviewStatus is the
   **project-scope** decision). Concrete sources to
   prefer / never use (Section 13 sets the rules; this is the list).
   Consumed by Research (Step 7). Entries may originate from the
   **global Source Library** (§6B, `libraryEntryId` set) or be added
   for this project only; web-discovered sources approved for the
   project land here via the §6B review queue (docs/RESEARCH_SOURCES.md).
2. `doNotRepeat` — `{ kind: topic|story|angle|hook|opening|example,
   text, runId?, videoTitle?, addedBy: auto|user, createdAt }`.
   Everything already covered. **Auto-populated**: completing a
   Production Package (Step 14) appends the run's topic, hook, opening
   line and key stories/examples. Users may add manual entries (e.g.
   a story a competitor just covered). Consumed by Topic dedupe
   (Step 5) + Originality audit (Step 12).
3. `masterTimeline` — `{ event, dateOrRange, era, relatedCharacters[],
   relatedPlaces[], sourceRef, certainty }`. The niche/era chronology
   every video must agree with (Character timeline = one life; this =
   the whole world). Consumed by Research + Fact audit.
4. `locationSettings` — `{ name, kind, era, lockedVisualDescription,
   promptSuffix, relatedIds[] }`. Recurring places with a locked visual
   description appended to image prompts, exactly like character
   appearance consistency. Consumed by Scene Breakdown (Step 11).
5. `hookOpeningLibrary` — `{ hookKind, text, structureId?, subNicheId?,
   performanceNote, status: approved|testing|archived }`. Concrete
   approved hooks/opening lines to pick from (Section 6 holds the
   abstract formulas). Consumed by Outline (Step 9).
6. `phraseBank` — `{ category: transition|segmentIntro|catchphrase|cta|
   closing|disclaimer, text, platform?, usageNote }`. Exact approved
   wordings that keep sentence-level voice consistent. Consumed by
   Script Drafting (Step 10).
7. `assetSourceList` — `{ kind: music|sfx|stockFootage|stockImage,
   name, ref, licenseNote, listStatus: approved|blocked }`. Named asset
   sources with licensing status (Section 11 defines the sound; this
   names where from). Consumed by Visual & Asset Research (Step 16)
   license checks.

Endpoints: `GET/POST/PATCH/DELETE /projects/:id/master-lists/:listKey`
(entries CRUD + search; delete = archive for entries already used by a
run), `GET /runs/:runId/master-list-snapshot`.

**Bible Registries (Registry Map, docs/REGISTRY_MAP.md — added
2026-10-27):** typed entity registries in the project Bible —
`RegistryModule { registryType, entries[] }` with **11 types**
(character, place, knowledge, caseEvent, creature, storyWorld,
organisation, product, concept, work, propsWardrobe), entry shapes
per docs/REGISTRY_MAP.md Part A. The module CRUD endpoints
(`/projects/:id/registries/:registryType/...`, mirroring master
lists) apply to all 11 types including propsWardrobe. Knowledge registry has a
**Verified Data variant** (standing pre-verified figures for
finance/data niches), and the annex library includes a
**Data Visualization Annex** (chart rules for data-heavy niches) —
both from the user's 39-file Bible list, mapped in
docs/BIBLE_FILE_MAPPING.md, which also adds Scene fields
`shotType / cameraMove / animationNote` (Camera & Animation Direction
standard) and two Step 12 instruments: Editorial Depth Review +
Production Detail completeness check. A Niche Template's `registries[]`
(primary + secondary types per the category map in Part B, overrides
in Part C) decides which modules a project has; Character/Place/
Knowledge-safety modules live inside their annexes, the rest are
standalone. Endpoints mirror master-lists:
`GET/POST/PATCH/DELETE /projects/:id/registries/:registryType`
(+ search; archive-not-delete for used entries; runs snapshot used
entries). **Angle Registry** lives on the niche (Admin data, not the
project): Angle `{ slug, angle, question, scope, evidence, boundary }`
endpoints under §6A niches; a Run records `angleId + storyQuestion`
and the scope snapshot (Run create, §6). **Title-only angles
(2026-10-27):** the seeded angles imported from the user's
ANGLES_MASTER.md carry titles only — question/scope/evidence/
boundary are optional in the DTO and the record carries
`completeness: title_only | complete` (complete only when an admin
has filled all four; AI suggestions may be stored in
`suggestedFields` as labelled drafts, never auto-applied). A run
selecting a title-only angle follows the story-question path:
`POST /runs/:runId/research/run` is rejected with `VALIDATION`
until the run carries a story question, and the brief records the
angle as title-only with no scope boundary (visible, never silently
assumed). Completing an angle's fields affects new runs only; run
snapshots never change.
**Registry enrichments (docs/PHASE2_ADDITIONS.md):** Character
entries carry variants[] (story-date/event + scene-range scoped,
persistent features), design status (proposed|approved + evidence),
a negative-prompt/exclusion brief, an expression/gesture sheet, and
a depiction class (depicted|mention_only|absent); Props & Wardrobe
entries carry a per-scene **state table** (owner/wearer, change type);
Place entries carry `cameraGeography` (crops/reverses are views, not
new entries); timelines may record character **knowledge states**;
registry entries record appearance **departures** from sourced
descriptions. Projects also hold a **Shot Recipe Library**
(`GET/POST/PATCH/DELETE /projects/:id/shot-recipes`, SHOT_ ids + spatial
continuity fields; delete = archive when a scene already references
the recipe) that scenes may reference. Source records carry
`versionTranslationLimits`; Verified Data entries carry
`methodologyNote`.

**Visual Styles (archetype-first, docs/VISUAL_STYLE_SYSTEM.md):**
16 Admin-managed `VisualArchetype` presets (full 10-field schema:
language, palette, lighting, camera, motion, texture, graphics,
thumbnail, prompt keywords, avoid) served with niche/template data.
Project Bible Visual section stores `{ archetypeId,
archetypeVersion, overrides }` — the niche→archetype mapping
(category defaults + niche overrides) is seed data from that doc,
editable in Admin; there are no per-niche style rows to maintain.
Serving: `GET /visual-archetypes` (active archetypes, full 10-field
schema + version) and `GET /visual-archetypes/:id` are user-read;
the library is Admin-managed: `GET/POST/PATCH/DELETE
/admin/visual-archetypes` (Admin Spec §8; delete = archive when any
Bible version references the archetype; edits create a new
`archetypeVersion`, Bibles keep the version they stored).
**Dual-archetype resolution (D5):** a mapping row may name
`{ primaryArchetypeId, secondaryArchetypeId }`; resolution follows
the field-owner split in docs/VISUAL_STYLE_SYSTEM.md (primary owns
Visual Language/Camera/Motion/Thumbnail; secondary owns
Palette/Lighting/Texture/Graphics; prompt keywords + Avoid are
unions; owner-missing → compatible fallback → default chain). The
resolved Bible Visual stores per-field sources
(`fieldSources { field: { source, archetypeId } }`) alongside
`{ archetypeId, archetypeVersion, overrides }`; project overrides
apply last per field and survive mapping re-resolution (they
change only via a new Bible version). Rows declared contextual
(split by scene kind) resolve per scene kind instead. Acceptance:
the four worked examples in the visual doc (conflict, missing
owner value, union field, project override) resolve exactly as
specified, and editing a mapping after a run locks leaves the
run's resolved values byte-identical.

Brand additions on Project: `brandProfile` (name, industry, tagline,
description, market), `products[]` (facts only), `guidelines`
(mandatory phrases, disclaimers by category, claims allowed/not allowed,
banned/preferred words, default CTA), `campaigns[]` (a Run may link a
`campaignId`). **Campaign layer is OPTIONAL (user decision,
2026-10-27):** every Brand project has a system "Uncategorised"
campaign; runs link a real campaign only when the user organises
them into one. Personal projects ignore these fields (null, not errors).

## 6. Workflow Runs & Steps 4–15 (+16/17)

### Runs
| Method & Path | Notes |
|---|---|
| `POST /projects/:id/runs` | Creates Run at `TOPIC_LIST/ready`. Snapshots: `bibleVersion`, `configVersion` |
| `GET /projects/:id/runs` , `GET /runs/:runId` | Run detail returns full stage map + artifacts summary + `openIssues[]` |
| `PATCH /runs/:runId` | Title/notes only — stage changes happen only via step endpoints |
| `POST /runs/:runId/issues` , `PATCH /runs/:runId/issues/:issueId` | Explicit unresolved questions / assumptions (Control Rule 11): `{ text, kind: question|missing_info|assumption, stage, status: open|resolved, resolution? }` |

### Step 4–5 Topics
| Method & Path | Notes |
|---|---|
| `POST /runs/:runId/topics/generate` | Job. Input: `{ nicheId, subNicheId, count, mix: evergreen|trending|mixed }` → Topics[] with angle + audience hook |
| `POST /runs/:runId/topics` , `PATCH/DELETE /runs/:runId/topics/:topicId` | Manual topics. API runs the similarity dedupe check (§6A embeddings: semantic + keyword/exact, against the Topic Bank, prior runs and the Do-Not-Repeat list, within the owner's projects only) → `409 POSSIBLE_DUPLICATE` warning payload with `SimilarityMatch[]` (scores + context). Scores are indicators: the client may confirm-create for intentionally related topics by re-sending with **`confirmDuplicate: true`** — the acknowledgement (who, when, which matches were shown) is recorded on the topic. If the semantic check could not run, the payload says so (`semanticStatus`) instead of implying the topic is clear |
| `GET /runs/:runId/topics` | Filter by niche/sub-niche/status, sort by score |
| `POST /runs/:runId/topics/:topicId/evaluate` | Job or sync scoring on: audienceInterest, originality, storytellingPotential, researchFeasibility, relevance, productionRequirements, visualFeasibility → `scores{}` + `total` |
| `PATCH /runs/:runId/topics/:topicId/scores` | User score override (stored separately from AI scores; both kept) |
| `POST /runs/:runId/topics/:topicId/select` | **Approval action.** Sets `run.selectedTopicId`, stage → CONFIGURATION |

Also exposed project-wide as Topic Bank: topics not yet attached to a Run
live on the Project (`/projects/:id/topics`, same shape); creating a Run
can import a bank topic (`{ bankTopicId }` on Run create).

### Step 6 Configuration (Run-level)
`GET/PUT /runs/:runId/configuration` — starts as a copy of project
configuration, editable per Run. Saving a complete config marks the
stage `done`. Response always includes `inheritedFromProject: true/false`
per section after first save (for UI inherited/overridden display).

### Step 7 Research & Fact Verification
| Method & Path | Notes |
|---|---|
| `POST /runs/:runId/research/run` | Job → ResearchBrief draft. Body `{ mode? }` — research mode `curated_first` (default) / `curated_only` / `web_only` / `selected_only`, defaulting to the project default (docs/RESEARCH_SOURCES.md). **Leads are not evidence:** topic ideas, presets, angle scope leads and shared source-library entries are discovery records only — verified status is never inherited; every claim is re-inspected in this run (exact passage, date/version, limitations). The job **fetches** candidate source content itself; a saved URL is never treated as read. In `curated_first`, if important parts of the script cannot be supported, the job ends in state `gap_review` (see gaps endpoints) and **never searches the web unapproved** |
| `GET /runs/:runId/research/gaps` | The specific unsupported parts found by the research job: `{ gaps: [{ id, description, affectedScope, suggestedQueries[] }] }`, logged against the niche for coverage prioritisation |
| `POST /runs/:runId/research/approve-web-fallback` | Body `{ gapIds[] }` — user approves web research for the named gaps only; triggers the web-discovery job (fallback mechanism is an Admin-enabled module, §6B). Not available in `curated_only`/`selected_only` (mode must be changed first) |
| `POST /runs/:runId/research/narrow-scope` | User accepts the insufficient-evidence path: body `{ acceptedScope }` records the explicitly reduced scope/angle the run will support; research completes on supported material only |
| `GET /runs/:runId/research/discovered-sources` | Web-discovered sources for this run, each `{ ..., origin: web_discovered, reviewState: pending|approved_project|promoted_global|unapproved|blocked }` — labelled `web_discovered` in the brief and the Package bibliography, never merged silently with approved sources |
| `POST /runs/:runId/research/sources/:sourceId/review` | Review-queue action on a web-discovered source: `{ action: approve_project|promote_global|leave_unapproved|block, note? }`. approve_project adds it to the project Master Source List; promote_global sends it to the global library with reviewStatus `pending` (Admin then sets credibilityTier + the global review decision); block records reviewStatus `blocked` at the applicable scope so it never resurfaces |
| `GET /runs/:runId/research` | Brief: summary `{ storyInBrief, whyNow, centralQuestion (the run's story question), keyTurningPoints[], legalEthicalFlags[] }`, researchQuestions[], keyFacts[], timeline[], entities[], statistics[], examples[], hookMaterial, visualMaterial[], conflicts[], lowResearchWarning. Verified `timeline[]` events are proposed as Master Timeline/Chronology entries on approval |
| `POST /runs/:runId/research/sources` , `PATCH/DELETE .../:sourceId` | Source: `{ title, url?, publisher?, accessedAt, credibilityTier: 1|2|3|4|5|null, reviewStatus: approved|pending|blocked, origin: library|project|user_supplied|web_discovered, note }` — credibility tiers per Bible §13 (1 primary … 4 use-with-caution, **5 = do-not-use, blocked in every scope**); reviewStatus is the effective decision for this run after scope precedence (global → project → run; a broader block always wins — docs/RESEARCH_SOURCES.md, A5). Origin, credibility tier and review status are always returned and displayed **separately**. A web-discovered source may support a claim only after its content is fetched and the passage verified in this run (§6B); using it in a run never approves it for the project or library |
| `POST /runs/:runId/research/claims` , `PATCH .../:claimId` | Claim: `{ text, status: verified_fact|assumption|speculation|conflicting, sourceIds[] (required if verified_fact), sourceLocation (exact passage/page/section in the source), accessedAt, confidence: high|medium|low, riskLevel: none|low|moderate|high|critical, riskNote?, conflictResolution? , note }`. **Verification standard (§13):** a figure/hard-fact claim is `verified_fact` only with ONE primary (tier-1) source or TWO independent credible sources; conflicting claims record the resolution rationale in `conflictResolution`. **Research-stage legal flags:** claims accusing named people/entities, about living persons, or alleging health dangers must carry a riskLevel + note — they flow into scene legalRiskFlags and the Legal Review Summary |
| `POST /runs/:runId/research/approve` | **Approval.** Blocked (422) if any claim marked for use in script has status `verified_fact` with zero sources, or if unresolved `conflicting` claims are not either resolved or copied to `openIssues[]` |

Control Rule 9 is data-enforced here: there is no endpoint state in
which an unsourced claim can be labelled `verified_fact`.

### Step 8 Bible (Run-level)
`GET /runs/:runId/bible` — the locked Bible version for this Run.
`POST /runs/:runId/bible/confirm` — required if project Bible has a newer
approved version than the Run snapshot; body `{ acceptVersion: <v> | keepSnapshot: true }`. Either choice is recorded.

### Step 9 Outline
| Method & Path | Notes |
|---|---|
| `POST /runs/:runId/outline/generate` | Job (Bible + approved Research + config) |
| `GET /runs/:runId/outline` , `PATCH /runs/:runId/outline` | Outline: ordered sections `{ key: hook|intro|setup|development|conflict|revelation|transition|climax|conclusion|cta, title, purpose, keyPoints[], claimIds[] }`. PATCH edits the draft version |
| `POST /runs/:runId/outline/approve` | **Approval.** Creates immutable Outline version |

### Step 10 Script Drafting
| Method & Path | Notes |
|---|---|
| `POST /runs/:runId/script/generate` | Job, per approved outline |
| `POST /runs/:runId/script/sections/:sectionKey/regenerate` | Job, one section only |
| `GET /runs/:runId/script` , `PATCH /runs/:runId/script` | Script: sections[] of narration text, `wordCount`, `estimatedDurationSec` (from config pacing), `durationDeltaSec` vs target |
| `GET /runs/:runId/script/versions` | Every generate/edit-approval creates a version |

### Step 11 Scene Breakdown
| Method & Path | Notes |
|---|---|
| `POST /runs/:runId/scenes/generate` | Job → Scene[] from current Script version |
| `GET /runs/:runId/scenes` , `POST /runs/:runId/scenes` , `PATCH/DELETE /runs/:runId/scenes/:sceneId` , `POST /runs/:runId/scenes/reorder` | Scene (v2.1, docs/SCENE_BREAKDOWN.md + docs/PHASE2_ADDITIONS.md G1): `{ sceneNo, chapterId, sectionKey, purpose, narration, speakerLabel, voWordCount, estimatedVoSec, visualDirection, shotDescription, shotType, cameraMove, animationNote, shotRecipeId?, footageRequirement, aiImagePrompt, aiVideoPrompt, onScreenText, editorialOverlayInstructions, referenceInputs[], continuityState { startState, endState }, registryRefs { characterIds[], locationIds[], propIds[] }, periodLabel, claimIds[], sourceRefs[], legalRiskFlag, dataVizSpec?, sfx[], musicCue, transition, durationEstSec, retentionNote }` — generation runs in ranges of 25 scenes with a per-range safeguards pass and updates the Run Continuity Context; project setting `sceneReviewMode: auto | first_range_review` |
| `POST /runs/:runId/scenes/:sceneId/regenerate` | Job, `{ target: narration|visual|both }` |
| Validation | **DataVizSpec (D4):** a scene directing a chart must carry a valid `dataVizSpec` (schema in docs/SCENE_BREAKDOWN.md; DTO in Shared) — chartType in the run's snapshotted vocabulary version, per-type required fields present, every factual series linked to a Verified Data entry or verified claim of this run (else `missing_evidence`), scale rules enforced (bar/column zero-baseline unless an annex override note exists). An unsupported chart type is stored as a `dataVizRequest` draft — the scene stays incomplete and an Admin vocabulary-review item is queued; a wrong chart type is never substituted silently. Save is rejected as *complete* unless every scene meets the **Production Detail Standard** (docs/BIBLE_FILE_MAPPING.md Adoption 5 — the completeness function is the standard, C-block alignment): `narration`, `visualDirection`, shot/camera direction (`shotDescription` or `cameraMove`), an on-screen text **decision** (`onScreenText` set — an explicit none/no-text decision counts), a duration estimate (`durationEstSec`), and `registryRefs` wherever an entity appears in the scene. Draft save with gaps is allowed but the stage stays `in_progress` with the per-scene gap list returned. Totals (`sceneCount, totalWords, estimatedDurationSec, scenesMissingVisual`) are computed server-side on every response |

### Step 12–13 Audit, Revision, Final Approval
| Method & Path | Notes |
|---|---|
| `POST /runs/:runId/audit/run` | Job → AuditReport version |
| `GET /runs/:runId/audit` , `GET /runs/:runId/audit/versions` | Report: `areas{}` each `{ score, checks: [{ key, status: pass|fail|warn|na, naReason?, sceneNos[], message, suggestion }] }`, `totalScore`, `threshold`, `passed`, `mandatoryFailures[]` |
| Audit areas | factualAccuracy, sourceReliability, originality, narrativeCoherence, pacing, engagement, repetition, continuity, productionFeasibility, durationFit, bibleCompliance (+ brandCompliance for Brand). Scene-level safeguards checks (from the user's Phase 3 checklist, docs/SCENE_BREAKDOWN.md): every factual scene cites claimIds, zero placeholders, names/locations spelled per registry locks, VO word budget fits duration at Bible pacing, dataVizSpec complete where a chart is directed, visual direction specific (no vague directives), legalRiskFlag moderate/high resolved or flagged. **Seeded checks from the user's Phase 5 audit (docs/PHASE5_AUDIT_REVIEW.md):** chronology correctness, superlative claims ("first/only/largest") require a named source, jurisdiction correctness, circular-sourcing detection, quotes attributed with a date, AI-misrepresentation of real people, privacy/doxxing, hook accuracy (title/thumbnail promise matches content), terms explained on first use. **Conduct rules:** the audit job runs a distinct audit prompt profile (skeptical, independent of the drafting profile; unverifiable = fail), failures carry code + explanation + scene location + required fix, and audit performs **fixes only — no enhancements** (improvements defer to a future version). Checks that don't apply to the niche/platform are recorded `na` **with a reason**, never silently skipped. **Further checks (docs/PHASE2_ADDITIONS.md):** Continuity uses the causality-failure taxonomy (premature recognition, knowledge-before-explanation, object reset, impossible overlap, unrecorded cast entry) over scene continuity states + knowledge states; Originality includes the **external comparison standard** (bounded scope, inspected works listed, full content/transcripts — snippets never establish uniqueness, limitations visible, per-run verdicts) and the **internal similarity check** (§6A embeddings: this script vs the channel's previously written scripts + Do-Not-Repeat entries, matches returned with scores and context for the user to judge — never an automatic fail); if the semantic check did not run (`semanticStatus` not `complete`), the originality check is recorded **Not completed** and Final Approval requires its completion or a recorded override flag; the **beat coverage invariant** (beats = contiguous scene ranges, every scene exactly once, beat claims = union of scene claimIds) is validated at scene generation and in Audit; the **prompt-smuggling check** (prompts introduce no unplanned figures/objects/text/events); Editorial Depth issues a **per-deliverable verdict** (Needs work / Ready as text / N/A with reason / Not reviewed); `na` reasons must be substantive and a **non-waivable core set** (identity, evidence, narration, delivery, review records) can never be `na` |
| `POST /runs/:runId/audit/failures/:checkKey/auto-fix` | Job: regenerates only the affected scenes/sections, creates new Script/Scene version, marks AUDIT `needs_revision` |
| `POST /runs/:runId/audit/re-run` | Job: re-audit — full if script changed substantially (API decides by changed-scene ratio, threshold in platform settings), otherwise failed areas only |
| `POST /runs/:runId/final-approve` | **Approval.** Requires latest audit `passed=true`, OR `{ override:true, note }` + unresolved failures → `openIssues[]`. Sets approved Script/Scene version point. On approval the API issues the run's **Completion Certificate** (below) and the stage advances to PACKAGE |
| `GET /runs/:runId/certificate` | The run's Completion Certificate (404 until final approval): `{ runId, topic, auditedVersions { scriptVersion, sceneVersion, auditVersion, bibleVersion }, verdict: passed|passed_with_override, overrideNote?, failSummary, naSummary, auditorProfile, issuedAt }` — attests to the *text production package only*, not rendered assets or publication (docs/PHASE5_AUDIT_REVIEW.md). Immutable once issued (a re-approval after revision issues a new certificate and supersedes the old); ships inside the Package (Step 14) |

**Scoring model (A4, 2026-10-27 — canonical).** Each **applicable**
area is scored /10. The total is a **weighted sum out of 100**:
`total = Σ (areaScore ÷ 10 × areaWeight)`, where the weights of the
applicable areas sum to **100**. Weights are Admin-configurable and
**versioned** (`AuditWeightConfig`); every AuditReport records the
weights snapshot + config version it used, so past results stay
interpretable after settings change. **Default weights — standard
projects:** factualAccuracy 16, sourceReliability 12, originality 10,
narrativeCoherence 10, engagement 10, pacing 8, continuity 8,
productionFeasibility 8, repetition 6, durationFit 6, bibleCompliance
6 (= 100). **Brand projects** add brandCompliance 10 and rebalance:
factualAccuracy 14, sourceReliability 11, originality 9,
narrativeCoherence 9, engagement 9, pacing 7, continuity 7,
productionFeasibility 7, bibleCompliance 7, repetition 5,
durationFit 5 (= 100). Config validation on save: weights must be
≥ 0, every applicable area must have weight > 0, and the applicable
set must sum to exactly 100 — invalid configs are rejected and can
never be used by a run. **N/A areas:** an area (or check) marked
`na` with a reason is excluded and its weight is **redistributed
proportionally** across the remaining applicable areas; the report
shows configured weights and effective weights side by side.
**Incomplete audits:** if a *required* area cannot be assessed (e.g.
the originality semantic check did not run), the report is
`completeness: incomplete` with the unassessed areas listed — never
scored as zero and never silently excluded — and `passed` is not
computed until the audit is complete or the gap is overridden with
a recorded flag at Final Approval. **Critical issues are separate
from the total:** a failed check flagged `critical` (e.g. an
unsourced `verified_fact`, an unresolved high-risk legal flag,
prompt-smuggling, a non-waivable core check) sets
`blockedByCritical: true` and the audit cannot pass on score alone.
**Editorial Depth is NOT a scored area** — it remains the separate
per-deliverable verdict layer (Needs work / Ready as text / N/A /
Not reviewed, G9); any deliverable at "Needs work" blocks Final
Approval regardless of the total. Pass = `completeness: complete`
AND total ≥ threshold (platform default 80) AND no critical block.

### Step 14 Production Package
| Method & Path | Notes |
|---|---|
| `GET /runs/:runId/package/checklist` | Per-deliverable status computed from artifacts + project output requirements |
| `POST /runs/:runId/package/generate` | Job. Body: `{ deliverables[], formatProfileId? }` (defaults = required set; profile defaults from the run's `asset_method` config answer — question B18: stock | ai_generated | mixed, a handoff-only answer per docs/CONFIG_QUESTIONS.md; the project's config default applies when the run has not overridden it. `asset_method` is a config answer, not a separate project field). Builds files in object storage. Handoff + VO files render through the chosen **Output Format Profile** (docs/OUTPUT_FORMAT_PROFILES.md) and are validated against it (style, separators, per-unit limits, clip cap → clip-splitting) before the Package is ready. Profiles: `GET/POST/PATCH /admin/format-profiles` (Admin library, dynamic) |
| `GET /runs/:runId/package` | Manifest: package version, builtFrom { scriptVersion, sceneVersion, auditVersion, bibleVersion }, files[] `{ deliverable, format, downloadUrl (signed, expiring) }`, `outdated: bool` |
| Deliverables | The canonical **`PACKAGE_DELIVERABLES` list in Shared §5** (A11: 19 deliverables + the completionCertificate and generatorProfile records; this spec does not maintain its own list) — only those selected/required are built (master rule; the checklist computes the required set, core entries cannot be deselected). Unknown deliverable keys are rejected at build time. Clean VO renders as plain text, one file per project language with localised speaker labels; the AI Generation Handoff brief (asset_method) carries clip-cap splitting notes (clip-A/clip-B + stitching) when the named production tool has a clip limit — scene design itself stays tool-agnostic (docs/SCENE_BREAKDOWN.md). **Package additions (2026-10-27, from the user's Phase 4 file, docs/PHASE4_PACKAGE_REVIEW.md):** `projectSummary` front sheet (title, angle, totals, versions used, key legal flags — rendered from the manifest); `entityReferenceSheet` (compiled from the registries the run used: spelling locks, pronunciation, status, legal/logo notes per entity); `legalReviewSummary` (high-risk claims table from scene legalRiskFlags + audit, disclaimers-included checklist, Language Softening Log from audit fix/revision records); `researchReferences` is structured as citations by scene + a consolidated bibliography grouped by credibility tier (A5 field; web-discovered sources listed separately with their origin and review status); `descriptionMetadata` includes the Monetization Annex disclosure checklist (sponsored / affiliate / ad-friendly / niche disclaimer present); `viewerGlossary` (audience-facing glossary built per run from the §10 entries actually used, sourced per run — docs/PHASE2_ADDITIONS.md G10). The Package also carries the run's **Generator Profile record** (selected tool/model/version, capabilities verified with date + source, reference inputs in order) and prior package versions are **retained** — the `outdated` fingerprint includes the format-profile/toolchain versions used, not only artifact versions. Handoff clip accounting: child clips keep the parent scene ID, child durations sum to the parent, each split records a join/handle plan, and AI imagery is never labelled archival footage or documentary evidence |

### Step 15 Performance Feedback Loop
| Method & Path | Notes |
|---|---|
| `POST /runs/:runId/performance` , `GET/PATCH ...` | Metrics: `{ publishedUrl?, platform, publishedAt, ctr, retentionPct, avgViewDurationSec, views, likes, comments, shares, dropOffPoints: [{ atSec, note }] }`. CSV import: `POST .../performance/import`. **Primary source is the YouTube API from day one** (user decision, 2026-10-27): `POST /me/youtube/connect` (OAuth channel link), `POST /runs/:runId/performance/sync` (Job — pulls views/CTR/retention/avg duration/engagement + retention-curve drop-off points from YouTube Analytics for the run's video); manual entry/CSV remain as fallback. Publication record fields stay **Pending** until real — never invent URLs or approvals. The run also keeps a **Corrections Log** (post-publication corrections: what was wrong, correction made, where announced) feeding Performance Learnings |
| `POST /runs/:runId/performance/insights` | Job → insights: hook/pacing/structure findings + recommendations. Recommendations that would change the Bible are returned as *proposed Bible edits* on the Project (`proposedBibleEdits[]`, user approves/rejects via Bible endpoints) — API never auto-modifies an approved Bible |
| `GET /runs/:runId/corrections` , `POST /runs/:runId/corrections` | The run's **Corrections Log** (post-publication): entry `{ id, field, whatWasWrong, correctionMade, whereAnnounced?, publishedAt?, createdAt }` (`field` = the script/package section or claim corrected). Entries are append-only (a wrong entry is corrected by a new entry referencing it, never edited silently); consumed by Performance insights + the Bible Performance Learnings Log approval flow |

**YouTube connection (per user, `YoutubeConnection`):**
`POST /me/youtube/connect` starts OAuth (server-side flow, state +
PKCE); scopes are **read-only only**: `youtube.readonly` +
`yt-analytics.readonly` — no upload/manage scopes are ever
requested. Access + refresh tokens are stored **encrypted at rest**
(server encryption key from `.env` — per-user OAuth tokens cannot
live in `.env`, which holds only the OAuth client credentials);
tokens are **never returned by any endpoint and never logged**.
`GET /me/youtube` → connection status only: `{ connected: bool,
channelId?, channelTitle?, scopes[], syncStatus:
idle|syncing|quota_exceeded|reauth_required|error, lastSyncedAt?,
lastError? }`. Refresh is automatic; an invalid/revoked grant moves
the connection to `reauth_required` and syncs stop until the user
reconnects. `DELETE /me/youtube` disconnects: the grant is
**revoked at Google** and the stored tokens are deleted; metrics
already synced are **kept** on their performance records, marked as
last-synced values with the connection removed (records show
`syncStatus: disconnected`). **Matching:** a run syncs only when
its performance record carries a user-set `youtubeVideoId` (full
URL or bare ID, normalised on save; sync without one → `422
no_video_match`, never a guessed match). **Failures:** YouTube API
quota exhaustion → sync Job fails with connection `syncStatus:
quota_exceeded` + `retryAfter` from the API response; the Job is
retryable after that time and manual metrics remain editable.
Per-record `syncStatus: never|synced|stale|disconnected` mirrors
the connection state at record level.

### Optional 16–17 (feature-flagged, API returns `FEATURE_DISABLED 403` if off)
- 16: `POST /runs/:runId/assets/research` (Job), `GET/PATCH /runs/:runId/assets` —
  Asset: `{ sceneId?, type: footage|archive_image|graphic|music|font|narrator_voice|other, description, sourceNote, licenseStatus: unverified|verified|restricted, attribution, usageRightsNote, checksum? }`. Package generation warns/blocks (per project config) on unverified assets if module enabled.
- 17: `POST /runs/:runId/publishing/generate` (Job), `GET/PATCH /runs/:runId/publishing` —
  `{ titles[], description, thumbnailBriefs[], chapters[], subtitlesPlan, tags[], pinnedComment?, recommendations[] }`. Output attaches to Package manifest when generated before packaging; if generated after, Package becomes `outdated` until regenerated (client chooses). Seed optimisation checklist (from the user's Phase 5 Section F): title <100 chars with keyword/emotional trigger and matching the script, thumbnail free of misleading claims, description with primary keyword + summary + timestamps + source links, 15–20 relevant tags, end-screen/card suggestions with timestamps.

## 6A. Dynamic Taxonomy & Configuration Questions (FULLY DYNAMIC, NO LIMITS)

User decision (2026-10-27): personal project — **no count limits anywhere
in this section**, and nothing here is hard-coded. Niches, sub-niches,
presets, and configuration questions are database records managed from
Admin; this API serves them as schemas, the Website renders them.

**Seed question set:** `docs/CONFIG_QUESTIONS.md` (v2) — the improved
replacement for the user's legacy Q1–Q42 Phase-0 set: 12 conflicts
resolved (duplicates merged, broken Q23 deleted, process/policy items
removed from questions), split into Layer A project questions (14,
asked once) + Layer B run questions (18, per video) + niche-wise
question packs per category. ConfigQuestion records carry `legacyId`
(Q1–Q42) for migration of existing CONFIG files. Layer A scope =
`project`, Layer B scope = `run`, packs scope = niche/category
assignments. **Custom answers (v2.2):** choice-question answers may be
`{ value: "custom", customText }` when the question allows it;
`ConfigAnswer` stores the custom text verbatim + schema version, it
snapshots into runs like any answer, custom values feeding locked
Bible fields take effect only on Bible approval, and users may save a
custom answer as a personal preset for reuse (Admin may promote
popular customs into shared options).

| Method & Path | Notes |
|---|---|
| `GET /taxonomy/niches` , `GET /taxonomy/niches/:id/sub-niches` | Active library items, ordered by Admin `order`. No count cap |
| `GET /presets/:kind` | `kind: tone|visual_style|hook|structure|cta|platform_pattern` — dynamic lists, no cap |
| `GET /config-schema` | The dynamic question schema for a flow. Query: `?projectId=&nicheId=&subNicheId=&stepKey=` → returns applicable `ConfigQuestion[]` (global + niche + sub-niche + step scoped) with type, options, order, grouping, required, defaults, conditions, and `mapsTo`. Website renders its configuration form from this response only |
| `POST /projects/:id/config-answers` , `GET ...` | Answers stored by question `key` + `questionVersion` — **the stored answers are the source of truth**. Typed config fields are a server-side projection: when a question declares `mapsTo`, saving its answer writes through to that typed field; typed fields with no backing question are system-computed/internal only. If a projection and a stored answer ever disagree, the answer wins and the projection is rebuilt (B-sweep: replaces the undefined "alongside"). Validation is generated from the question's own `validation` rules |
| `POST/PATCH /admin/taxonomy/niches` , `.../sub-niches` , `POST/PATCH /admin/presets/:kind` | Admin CRUD, draft/active/archived, versioned (Admin Spec §8) |
| `POST/PATCH /admin/config-questions` , `POST .../:id/publish` | Admin Question Builder CRUD. Publish creates a new question version; in-use questions archive, never hard-delete |
| `GET/POST/PATCH /admin/model-providers` , `POST .../:id/test` | AI Model Providers (docs/MODEL_PROVIDERS.md): provider registry (built-in presets + custom OpenAI-compatible endpoints), model catalogue per provider, connection test. API keys are read from server `.env` only — never accepted, stored or returned by the API |
| `GET/PUT /admin/model-assignments` | Per-stage assignment `{ stage, providerId, modelId, params, fallbackChain[] }`. Generation jobs resolve stage → assignment (Niche Template override → global), record `{ providerId, modelId, promptVersion, tokensIn, tokensOut }` on the Job and snapshot assignments into the run's Generator Profile |
| Embeddings & similarity (A2, docs/MODEL_PROVIDERS.md §5) | The catalogue includes `modelType: embedding` models; the assignments include a single **embedding assignment**. Vectors are stored in the main DB (pgvector) as `EmbeddingRecord { entityType: topic|doNotRepeatEntry|script|scene, entityId, ownerId, projectId, modelId, modelVersion, vector, createdAt }`; every vector is stamped with the model + version that produced it. Similarity is used by topic dedupe (Step 4–5), Do-Not-Repeat matching (§5) and originality (Step 12), **scoped to the owning user's projects/channels only**. Results combine semantic score + keyword/exact signals and return `SimilarityMatch { entityType, entityId, title, semanticScore, keywordScore, context }` lists — **indicators, never auto-rejection**. `GET/PUT /admin/similarity-thresholds { topicDedupe, doNotRepeat, originality }` (per-purpose, Admin); `POST /admin/embeddings/reindex { scope }` re-embeds after a model change (vectors are `stale` until done). When no embedding model is available, checks return `semanticStatus: unavailable|keyword_only|complete|stale_model`; **originality may not be reported as clear unless status is `complete`** |

`ConfigQuestion` shape is defined in Admin Spec §8 and `packages/shared`.
Adding a record via Admin + activating it is sufficient for it to appear
in `GET /config-schema` — no API or frontend release is involved.

### Niche-wise Questions & Niche Templates (reuse)

| Method & Path | Notes |
|---|---|
| `GET /niches/:nicheId/questions` | Resolved questions list for a niche: global (inherited) + niche-assigned + per-sub-niche groups, in display order, each item marked `mode: assigned|cloned` |
| `POST /admin/niches/:nicheId/questions` | Body `{ questionId, mode: assign|clone, overrides?: { order, required, defaultValue, group } }`. Assign links the library question; clone creates an independent niche-specific copy and returns its new id |
| `DELETE /admin/niches/:nicheId/questions/:assignmentId` | Removes the assignment/clone from this niche only — never deletes the library question |
| `GET /admin/niches/:nicheId/angles` , `POST ...` , `PATCH/DELETE .../:angleId` | **Angle Registry CRUD** (Admin; the Angle Registry lives on the niche, §5). Angle: `{ id, slug, angle, question, scope, evidence, boundary, status: active|archived, version }`. Validation: `slug` unique per niche (`409` on duplicate), required fields non-empty. Edits create a new `version` (runs keep the version they snapshotted). DELETE = **archive, not hard delete**, when any Run references the angle; hard delete only when never used |
| `GET /niches/:nicheId/angles` | Run-side read path: active angles for the niche (user auth, owner-scoped via the run's project). Run create (§6) records `angleId + angleVersion + storyQuestion` and snapshots `scope` into the Run config — later angle edits never mutate existing runs |
| `GET /niche-templates` | Query `?nicheId=&subNicheId=&scope=global|personal` → templates with `isDefault`, version, sections present |
| `GET /niche-templates/:id` | Full template: **10 sections** (Admin Spec §8) as structured JSON + sub-niche overrides. **Registries section (A8):** `sections.registries` is `null` (inherit) or `{ mode: "explicit", primary: RegistryType, secondary: RegistryType[] }`. Resolution for a niche's registry set: **template explicit → per-niche override (`NicheRegistryOverride`, from Registry Map Part C) → category map default** (by `categoryKey`, A6). Clearing an override = setting the section back to `null` (or deleting the niche override record), which restores inheritance; `secondary: []` inside an explicit section is an intentional empty selection, never inheritance. Validation on save (422): primary/secondary must be valid `RegistryType` values (the 11, incl. `propsWardrobe`), primary ∉ secondary, no duplicate secondary entries, overrides must reference existing niches and set at least one of primary/secondary; ambiguous assignments (e.g. the facts category's inherit-the-subject rule) are flagged for Admin review, never guessed. Existing templates without the section resolve by inheritance — nothing is written or overwritten until an Admin explicitly saves the section. Example (explicit): `"registries": { "mode": "explicit", "primary": "character", "secondary": ["place", "caseEvent", "propsWardrobe"] }`; example (inherit): `"registries": null` |
| `POST/PATCH /admin/niche-templates` , `POST /niche-templates` | Admin creates global templates; a user creates personal templates (same shape). Clone: `POST /niche-templates/:id/clone { targetNicheId?, scope? }` |
| `POST /projects/:id/apply-template` | Body `{ templateId, sections?: [] }` (default: all present sections). Copies a snapshot into the project: strategy defaults, config defaults, Bible draft source, research checklist, structure choices, audit add-ons, packaging defaults. Records `appliedTemplateId + templateVersion` on the project. Returns per-section `applied|skipped|conflict` — a conflict (project already has user-edited content in that section) is never overwritten; client offers per-section replace |
| `POST /projects/:id/save-as-template` | Body `{ nicheId, subNicheId?, name, scope: personal|global (global = admin only) }` → creates a Niche Template from this project's current strategy/config/Bible/research/audit/packaging setup |
| `GET /projects/:id/template-status` | `{ appliedTemplateId, appliedVersion, latestVersion, changedSections[] }` — powers the "new template version available" diff; re-apply is `POST /projects/:id/apply-template` again, explicit only |
| `GET /annex-templates` , `POST/PATCH /admin/annex-templates` | Bible Annex templates: built-ins (`monetizationSponsor`, `accessibility`, `character`, subject annexes) + Admin-created annexes for any niche, with dynamic field definitions. A Niche Template lists its active annex template ids — that is what turns an annex ON for projects of that niche |
| `GET/PUT /projects/:id/bible/annexes` | The project's active annex instances on the current Bible draft: list, activate/deactivate (records a new Bible version on approval), and edit annex data (e.g. Character Registry entries, herb/place registry entries) |

## 6B. Source Library & Research Retrieval (CURATED FIRST — A1, 2026-10-27)

Canonical design: docs/RESEARCH_SOURCES.md. Research is **curated
sources first**; web research is an approved fallback, never a silent
switch. Search results and library entries are **leads, not evidence**
— a source supports a claim only after the platform fetches its
content in the run and verifies the exact passage (Step 7 rules).

**Global Source Library (Admin, `/admin/source-library`):**
`GET/POST/PATCH/DELETE /admin/source-library` — entry `{ name, url,
kind: scripture|translation|commentary|academic|official|news|book|
archive|journal|document|site|channel, language?, author?,
publisher?, edition?, scope: single_page|site_section|whole_site,
scopeNote?, categoryIds[], nicheIds[], topicTags[], credibilityTier:
1–5|null, availability: enabled|disabled|inaccessible,
reviewStatus: approved|pending|blocked, lastCheckedAt?,
reviewHistory[] }` (A5: credibility, review decision and
availability are three separate fields; the entry's reviewStatus is
the **global-scope** decision — project and run scopes layer per the
precedence rules in docs/RESEARCH_SOURCES.md, and tier 5 is blocked
in every scope).
Duplicate check on create (normalised URL; near-duplicate title
warns). **Migration (A5):** legacy entries whose only value was
`tier: approved|blocked` migrate that value to reviewStatus and keep
`credibilityTier: null` flagged `needs_tier_review` — a tier is
never inferred from an approval. **Starter bundles:** `GET/POST/PATCH /admin/source-bundles`,
`POST /admin/source-bundles/:id/apply { nicheIds[]|projectId }` — a
bundle must be marked reviewed before it can be applied; a Niche
Template may reference a bundle. **Niche coverage:**
`GET /admin/niche-coverage`, `PATCH /admin/niche-coverage/:nicheId
{ status: not_assessed|needs_sources|partial|ready, note }` —
`ready` is a reviewed judgment (reviewer + date + note recorded),
never a URL count. Coverage is prioritised by run usage and the
**gap log** (every research gap / insufficient-evidence outcome is
recorded against its niche). **Review queue (Admin view):**
`GET /admin/source-review-queue` — web-discovered sources awaiting a
promote/block decision platform-wide.

**Project level:** `POST /projects/:projectId/source-list/from-library
{ libraryEntryIds[] }` attaches global entries to the project's
Master Source List (§5); project-specific sources are added through
the §5 master-list endpoints. Project config carries
`researchModeDefault` (Step 6 typed field).

**Fetching & link checks:** the research job fetches candidate
source content itself (fetch failures mark the source unusable for
that run, never bypassed). A scheduled **link-check job** re-tests
library entries, updates `lastCheckedAt`/status, and surfaces
`inaccessible` entries in Admin. **Web fallback module:** the search
mechanism (dedicated search provider / LLM native search / hybrid)
is enabled and chosen in Admin settings; it may run only per the
Step 7 mode + gap-approval rules. **Sensitive claims (health):**
health claims default to `riskLevel` high+; traditional Ayurvedic
claims are recorded and worded as traditional use, never as proven
medical effectiveness/safety, which requires clinical-grade sources;
runs containing high/critical health claims keep the human-review
gate at research approval.

## 7. Jobs & Credits

- Estimate: `POST /jobs/estimate { action, params }` → `{ estimatedCredits, breakdown }`.
- Create: generation endpoints take `{ jobConfirm: { estimatedCredits } }`;
  mismatch with a fresh server estimate → `422` with the new estimate.
  **This body applies to EVERY Job-creating endpoint in §3–§6C**;
  the per-endpoint tables do not repeat it, and an endpoint whose
  row omits it is not exempt (B-sweep fix).
- Job resource: `GET /jobs/:jobId` → `{ status: queued|running|done|failed|cancelled, progressPct?, resultRefs, creditsCharged, error? }`.
  Optional webhook per user (see **Webhooks** below) on job done/failed.
- Charging: hold on create, capture on `done`, release on `failed`.
  Ledger entry always references `jobId` + `runId` + `action`.
- **Cancellation + partial results (B-sweep):** a queued job
  cancelled before it starts → hold fully released, status
  `cancelled`, no charge. A running job cancelled (by the user or
  an admin) stops at the next unit boundary: **completed units are
  charged at their actual cost, unstarted units are released** —
  the same per-unit rule as retries — and partial results are kept
  and marked partial, never discarded. If a job runs on a
  **fallback model** (primary unavailable), charging is at the
  model actually used, and the Generator Profile records which
  model produced the output. **Admin retries** reuse the original
  parameters and never double-charge units already completed
  (idempotency covers the retry).
- Idempotency: generation endpoints require `Idempotency-Key` header;
  a duplicate key returns the original Job, never a second charge.
- Rate limits: per user + per action, returned as standard headers;
  admin-configurable values (API reads platform settings).
- **Rate-limit + session specifics (C-block):** every response
  carries `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
  `X-RateLimit-Reset`; a `429` adds `Retry-After`. A **concurrent
  job cap per user** (platform setting) queues excess jobs instead
  of rejecting them (`JOB_ALREADY_RUNNING` remains for the same
  stage+range duplicates). **Tokens:** user access tokens are
  short-lived; refresh tokens **rotate on every refresh** and
  reuse of a rotated-out refresh token revokes the whole session
  family (theft detection) — the same rotation rule Admin §2
  already states for admin sessions. `POST /jobs/estimate` accepts
  the `JobAction` enum (Shared-owned): topic_generate,
  topic_evaluate, research_run, bible_generate, outline_generate,
  script_generate, scene_generate, audit_run, audit_autofix,
  package_generate, asset_research, publishing_generate,
  insights_generate, embedding_index, export_generate — one action
  per Job-creating endpoint; new job classes extend the enum, they
  never reuse a value.

**Uploads (user-supplied files — reference images, brand assets,
fonts, documents):** two-step direct-to-storage flow.
`POST /uploads/init { filename, contentType, sizeBytes, purpose:
scene_reference|brand_asset|asset_item|document|other }` → validates
`contentType` + `sizeBytes` against platform settings (allowed-type
list + per-purpose max size; violations → `422`) and returns
`{ uploadId, presignedUrl (expiring), expiresAt }`. The client
uploads bytes straight to object storage. `POST
/uploads/:id/complete { checksumSha256 }` → the server verifies
stored size + SHA-256 against the declared values; mismatch →
`status: failed` and the stored object is quarantined/deleted, never
attached. Upload record (`Upload`): `{ id, ownerId, filename,
contentType, sizeBytes, checksumSha256, purpose, status:
initiated|uploaded|verified|failed|expired, createdAt }` — an
`initiated` upload not completed before `expiresAt` becomes
`expired` and its presigned URL dies. Only `verified` uploads can be
attached, via the owning entity's own fields (Scene
`referenceInputs[]` uploadIds, Brand assets, Step 16 `AssetItem`);
attach endpoints re-check ownership + `verified` server-side.
`GET /uploads/:id`, `DELETE /uploads/:id` (owner-only; deleting an
attached upload is blocked with `409` until detached). A
malware-scan hook runs between `uploaded` and `verified` **when the
deployment configures a scanner** (deployment option — no vendor is
specified by this spec); without a scanner the step is a no-op and
the record says `scanStatus: not_configured`, never `clean`.

**Webhooks (per user):** `GET/POST /me/webhooks`,
`PATCH/DELETE /me/webhooks/:id` — subscription `{ id, url (https
only, validated), events[] (job.done, job.failed, package.ready,
audit.completed, performance.synced), secret, active }`. The
`secret` is generated server-side and **returned once, at creation
only**; it is stored hashed and can be rotated (`POST
/me/webhooks/:id/rotate-secret` → new secret returned once, old one
invalidated). Deliveries are POSTs signed with HMAC-SHA256 over the
raw body (signature + timestamp headers; receivers reject stale
timestamps), carry `{ event, data, deliveryId }`, and retry with
exponential backoff (bounded attempts over ~24h); every attempt is
logged without payload secrets. A subscription that fails
continuously past the platform threshold is **auto-disabled**
(`active: false`, owner notified in-app + email) rather than
retried forever; the owner re-enables it manually. Webhook URLs are
called server-side only — the API never follows redirects to
non-https targets.

## 8. Data Model (core tables)

`User, Plan, CreditLedger, WorkspaceProject, Niche, SubNiche,
AudienceStrategy, ProjectConfiguration, ProductionBibleVersion,
BrandProduct, BrandGuideline, Campaign, TopicBankItem, WorkflowRun,
RunConfiguration, Topic, TopicEvaluation, ResearchBrief, Source, Claim,
OutlineVersion, ScriptVersion, Scene, AuditReportVersion,
ProductionPackage, PackageFile, PerformanceRecord, PerformanceInsight,
AssetItem, PublishingOutput, Job, OpenIssue, FeatureFlag, PromptTemplate,
TaxonomyPreset, ConfigQuestion, ConfigAnswer, NicheQuestionAssignment,
NicheTemplate, NicheTemplateVersion, AnnexTemplate, BibleAnnex,
BibleMasterListEntry, RegistryModule, RegistryEntry, NicheAngle,
SourceLibraryEntry, SourceBundle, NicheCoverage, ResearchGap,
EmbeddingRecord, PlatformSetting, AdminUser,
AdminAuditLog, SafetyFlag, ModelProvider, ProviderModel,
StageModelAssignment, AuditWeightConfig, OutputFormatProfile, VisualArchetype,
ShotRecipe, GeneratorProfile, CompletionCertificate,
CorrectionsLogEntry, ProposedBibleEdit, ProjectExport, Upload,
YoutubeConnection, WebhookSubscription, EmailToken`

Key relationships: Project 1—N Run; Run 1—1 selected Topic, ResearchBrief,
locked BibleVersion; Run 1—N Outline/Script/Audit/Package versions;
Scene N—1 ScriptVersion (scene set is versioned with its script);
Claim N—M Source; PerformanceRecord N—1 Run (one record per sync or
manual entry, full history retained — "the latest record" is a
query view over that history, not the storage shape; the earlier
"1—1 (latest) with history" phrasing contradicted itself).
Non-obvious ones: `StageModelAssignment` N—1 `ModelProvider` +
`ProviderModel` (stage → provider/model + fallback chain, §6A);
`GeneratorProfile` 1—1 Run (the snapshot of assignments actually
used); `CompletionCertificate` 1—1 Run (issued at final approval,
superseded — never edited — by a re-approval); `CorrectionsLogEntry`
N—1 Run (append-only); `ProposedBibleEdit` N—1 Project (source:
Step 15 insights); `ProjectExport` N—1 Project; `ShotRecipe` N—1
Project (scenes reference by SHOT_ id); `Upload` N—1 User,
attachable to Scenes/Brand assets/AssetItems by id;
`YoutubeConnection` 1—1 User (tokens encrypted at rest, never
serialised); `WebhookSubscription` N—1 User (secret hashed);
`EmailToken` N—1 User (`purpose: verify|reset`, token hashed,
single-use).

## 9. Admin API (`/admin/*`, admin JWT + role)

Mirrors `apps/admin/SPEC.md` routes 1:1: overview aggregates,
users (list/detail/status/plan/credit-adjustment with mandatory
`reason`), projects/runs (read + job retry/cancel + support note — **no
approve/verify/skip endpoints exist**), quality aggregates + unresolved
queues, taxonomy presets CRUD (draft/publish/archive), prompt templates
CRUD + test-run + publish/rollback (`super_admin` for publish),
plans/credit-packs CRUD, credit ledger (read), feature flags,
safety queue, performance aggregates, admin audit log (read/export),
platform settings. Every admin mutation writes an `AdminAuditLog` row
in the same transaction as the change.

**Seed data (A7, docs/SEED_DATA.md):** `GET /admin/seeds` (files +
versions + import state), `POST /admin/seeds/:seedKey/import`
(idempotent upsert by stable ID inside the system namespace;
locally-modified records surface as **conflicts**, never silently
overwritten; locally deleted records stay deleted), `GET
/admin/seeds/imports/:importId` (the import report: added / updated /
conflicted / skipped). User-created records are never touched by an
import. Model seeds obey the readiness rule (docs/SEED_DATA.md):
seeded providers/models are inert until enabled + key present +
test-connection passed + Admin activation, and stage assignments are
compatibility-validated (existence, active status, stage capability
— e.g. structured output for research/audit, embedding type +
multilingual for the embedding assignment).

## 10. Non-Functional

**Notifications (C-block spec):** in-app notification records
(`GET /me/notifications`, `POST /me/notifications/:id/read`,
`POST /me/notifications/read-all`) plus email for the marked subset,
sent through the §3 transactional email system. Types (each with a
per-type on/off preference in `/me` notification prefs; defaults
shown): `job_done` (in-app; email off), `job_failed` (in-app +
email), `audit_failed` (in-app + email), `audit_passed` (in-app;
email off), `credits_low` (balance below the platform threshold —
in-app + email), `package_ready` (in-app; email off),
`export_ready` (in-app + email — the signed link expires),
`verification_reminder` (email only), `deletion_scheduled` /
`deletion_cancelled` (email + in-app, not disableable — account
safety), `admin_message` (in-app + email — the Admin "contact
user" channel), `webhook_disabled` (in-app + email). Notifications
are records, not a chat system; nothing here adds user→user or
user→admin messaging.

- All generation prompts are server-side templates (Admin §9); user
  content is data into a template, never concatenated into a system prompt.
- PII/secrets: passwords hashed, provider keys only in env/secret store
  (never in DB responses), signed download URLs expire ≤ 1h.
  **No secret or token is ever written to logs or returned in a
  response** — this covers provider keys, email tokens (hashed at
  rest), webhook secrets (hashed; plaintext shown once at creation),
  and YouTube OAuth tokens (encrypted at rest with a server key from
  `.env`, never serialised).
- Transactional email is required infrastructure (§3): provider
  configured via server `.env` only (SMTP or API-based); if the
  provider is unconfigured the API still runs, but signup/verify/
  reset flows report the `emailStatus: delayed` state instead of
  pretending mail was sent.
- Soft delete for projects/runs with a restore window; hard delete only
  via the account-deletion flow (logged).
- Exports and job results retained per plan; API returns retention info
  on Package and Job resources.
- OpenAPI 3.1 document is generated from the implementation and must
  match this spec; contract tests cover every endpoint in §3–§9.

## 11. Acceptance Criteria (API)

- Calling step endpoints out of order returns `STAGE_LOCKED` naming the
  blocker in every case covered by §4 — no path advances a Run by
  skipping research approval, outline approval, audit, or final approval.
- An unsourced `verified_fact` claim cannot be saved (422).
- A Package cannot be generated for a Run without a passed audit or a
  recorded override with unresolved issues attached.
- Re-running generation with the same Idempotency-Key never double-charges.
- An unverified user creating any cost-incurring job receives
  `403 EMAIL_NOT_VERIFIED`, with **no credit hold placed and no
  provider called**; the same user can still log in, browse, edit
  manually, resend verification (within the cooldown/daily cap),
  and verify via a fresh link after the old one expires.
- Verification/admin independence: with the email provider
  disabled, bootstrap login, AdminUser management and admin
  password resets still work end to end.
- Data Viz (D4): the worked examples in docs/SCENE_BREAKDOWN.md
  behave as specified — the valid column chart saves as complete;
  the unlinked price series returns `missing_evidence` and the
  scene cannot complete; the truncated-axis bar chart fails naming
  the zero-baseline rule; the unsupported Sankey request saves as
  a `dataVizRequest` draft, keeps the scene incomplete, and queues
  an Admin vocabulary review — and a run locked under vocabulary
  v1 still validates against v1 after v2 ships.
- Lifecycle (D3): archiving a project with a running job cancels
  the job at the next unit boundary with per-unit charging and
  releases queued holds; no job can start on an archived or
  pending-deletion item; a deleted project restored within 30 days
  returns complete, and after purge only ledger entries and audit
  logs remain; an expired wizard draft deletes only draft data; a
  suspended user's API calls return `ACCOUNT_SUSPENDED` while
  their data stays intact for reactivation.
- Onboarding (D2): an unverified user can log in, browse, open the
  sample project and duplicate it, and cannot create any job
  (`EMAIL_NOT_VERIFIED`); the sample rejects mutations with
  `SAMPLE_READ_ONLY`; a password that is breached, too short, or
  very weak is rejected at signup, reset AND settings change, and
  with the breach-check service down a strong password is accepted
  with `breachCheck: unavailable` surfaced; a user who skips or
  fails YouTube connect completes onboarding and can run the full
  pipeline, connecting later from Settings.
- Character snapshots (A12): editing a Character Registry entry
  leaves every locked Bible version and completed run byte-identical
  in the characters they resolve; the drift endpoint reports the
  change; a new Bible version captures the new entry versions; and
  re-resolving an earlier run (by bibleVersionId + snapshot)
  reproduces exactly the character data it used. A pre-A12 project
  with conflicting annex/registry copies surfaces both in
  `migration_conflicts` with nothing discarded.
- Editing an approved script version is impossible; every edit is a new version.

## 12. Open Decisions

- ~~Framework/DB confirmation, queue system, and object storage
  provider~~ **Resolved 2026-10-27 (user confirmed the recommended
  stack): Next.js for web + admin; Fastify for this API; PostgreSQL
  with pgvector (per A2) via Drizzle ORM; BullMQ + Redis for the
  queue (Redis also serves rate-limit/session storage); storage
  coded to the S3 API — MinIO locally, provider (R2/S3) chosen at
  deploy time via env. Monorepo: pnpm workspaces + Turborepo +
  TypeScript (confirmed earlier).**
- ~~Email verification gating~~ **Resolved 2026-10-27:** verification
  gates cost-incurring actions (all credit/provider jobs) server-side
  (`403 EMAIL_NOT_VERIFIED`, checked before any credit hold); login,
  browsing, manual editing and the verification flow itself stay
  open. Full rules in §3.
- ~~Webhook vs polling-only for MVP job status~~ **Resolved
  2026-10-27: both, phased — polling in the MVP, push/webhook
  interface defined now and enabled later.**
- ~~SRT/VTT captions in MVP package~~ **Resolved 2026-10-27: MVP =
  narration caption text + timing plan; timed SRT/VTT generation is
  a later phase.**

# Research Sources — Curated Library First (A1 design, 2026-10-27)

Resolves DESIGN_AUDIT A1 (research retrieval mechanism). User decision:
**curated sources first; web research only as an approved fallback.**
The governing principle is unchanged and absolute: **search results
and library entries are leads, not evidence.** A source supports a
claim only after the platform has fetched its content in this run and
verified the exact passage (existing Step 7 rules: sourceLocation,
accessedAt, verification standard, tiers).

## 1. Research modes

Every research run operates in exactly one mode. A project sets the
default; each run may override it at research start.

| Mode | Behaviour |
|---|---|
| `curated_first` (**default**) | Research uses the project's usable sources (global library + project list). If an important part of the requested script cannot be supported, the run stops at a **gap prompt**: it lists the specific unsupported parts and asks the user before any web search. It **never silently switches** to web research. |
| `curated_only` | Library/project sources only. Web search is never performed unless the user changes the mode. |
| `web_only` | Web research without the library (for new/timely topics the library doesn't cover). Discovered sources still pass through §5 review labelling. |
| `selected_only` | Only the specific sources the user selected for this run. No web search unless the mode is changed. |

In `curated_only` and `selected_only`, insufficient material leads
to §6 outcomes — never to an unapproved search.

## 2. Two levels of sources

- **Global Source Library (Admin-managed)** — one library for the
  whole platform. Entries are tagged and reusable across projects
  and niches.
- **Project Master Source List** (existing Bible master list) — the
  project uses global entries and may add project-specific sources.
  Runs snapshot the sources they actually used (existing rule).

Existing rules are preserved at both levels: passage-level
verification and conflict recording, with the A5 field model below.

**Credibility vs review status (A5, 2026-10-27).** Two facts that
were both called "tier" are now separate fields everywhere:

- `credibilityTier: 1–5 | null` — how credible the source is
  (existing definitions; 1 primary … 4 use-with-caution). **Tier 5
  means do-not-use and is blocked in every scope, unconditionally.**
  `null` = not yet assessed (never guessed — see Migration).
- `reviewStatus: approved | pending | blocked` — the *decision*
  about the source. `pending` is the explicit unreviewed state
  (every web-discovered source starts here; nothing is silently
  treated as approved).
- `availability: enabled | disabled | inaccessible` — operational
  state only (link health, admin switch); it is not a review
  decision.

**Scope and precedence.** Review decisions exist per scope:
**global** (library entry), **project** (Master Source List entry),
and **run** (the A1 run-level use of a verified web-discovered
source). Precedence: a **block at any broader scope applies to all
narrower scopes** — a globally blocked source cannot be used by any
project or run; a project-blocked source cannot be used in that
project's runs even if globally approved. A narrower scope may be
*stricter* (a project may block a globally approved source) but
never looser than a broader block. Run-level use of a pending
web-discovered source (A1 §5) is permitted only when the source is
blocked in **no** applicable scope, and it changes nothing outside
that run: it does not approve the source for the project or the
library.

**Migration.** Pre-A5 Master Source List entries stored
`tier: approved|blocked` — those values were review decisions, so
they migrate to `reviewStatus` (approved→approved, blocked→blocked)
and their `credibilityTier` is left `null` and flagged
`needs_tier_review` in the Admin queue; **no tier is ever inferred
from an approval**. Run Sources stored `tier: 1–5`, which migrates
directly to `credibilityTier`; their reviewStatus comes from their
origin/scope chain (library/project entries inherit the scope
decision; web-discovered = pending). Any record missing either
field is flagged for review and cannot silently pass as assessed.

**Library entry:** `{ name, url, kind: scripture|translation|
commentary|academic|official|news|book|archive|journal|document|
site|channel, sourceTypeNote?, language?, author?, publisher?,
edition?, scope: single_page|site_section|whole_site, scopeNote?,
categoryIds[], nicheIds[], topicTags[], credibilityTier: 1–5 | null,
availability: enabled|disabled|inaccessible,
reviewStatus: approved|pending|blocked, lastCheckedAt?,
lastCheckResult?, reviewHistory[] }`. One entry may carry many topic tags (a Hanuman
source sits under Ramayana, Hanuman, and devotional stories at
once). Duplicate checks run on add: normalised-URL match and
near-duplicate title warning.

## 3. Fetching and records

- At research time the platform **fetches** each candidate source's
  content itself; a saved URL alone never counts as read. Fetched
  passages are what claims cite (`sourceLocation` + `accessedAt`).
- A periodic **link-check job** re-tests library entries and updates
  `lastCheckedAt` / status (`inaccessible` when a page is gone or
  blocked); Admin sees failures in the library view.
- Every status change, tier change, approval, promotion and block is
  appended to the entry's **review history** (who/when/what/why).
- Documents/PDF uploads are a later phase (ties to audit item A10);
  the entry schema already allows `kind: document` with no URL.

## 4. Cold start — starter bundles and coverage

- **Starter bundles:** reusable, *reviewed* sets of sources for
  priority niches and related topic clusters, assembled in Admin and
  attachable to niches/projects (a niche template may reference a
  bundle). A bundle is reviewed before it can be applied.
- **Niche coverage tracking:** every niche carries a coverage
  status — `not_assessed | needs_sources | partial | ready`.
  **Ready is a reviewed judgment, never a URL count**: marking a
  niche Ready requires a reviewer, a date, and a note (does the
  library actually support the niche's core topics, in the right
  languages/editions?).
- **Prioritisation:** coverage work is ordered by (a) project/run
  usage and (b) **recurring source gaps** — every gap prompt and
  insufficient-evidence outcome is logged against its niche, so the
  gaps users actually hit drive the next curation round.

## 5. Web fallback and discovered sources

- Web research runs only when the mode allows it AND — in
  `curated_first` — the user approves it at the gap prompt (the
  prompt names the specific missing pieces; approval can cover
  named gaps only). The fallback mechanism itself (dedicated search
  provider, LLM native search, or hybrid) is an Admin-enabled
  module chosen when the fallback is built; these rules bind
  whichever mechanism is used.
- Sources found on the web are **`web_discovered`**: visibly labelled
  in the Research Brief and in the Package bibliography, listed
  separately from library/approved sources.
- A web-discovered source may support a claim **only after** its
  content is fetched and the passage verified under the standard
  Step 7 rules. Discovery never confers approval.
- **Review queue:** every web-discovered source lands in a review
  queue (project view + Admin view) with four actions:
  **approve for this project** (joins the project Master Source
  List), **promote to the global library** (Admin; enters as
  `pending` until its credibilityTier and reviewStatus are set), **leave unapproved**
  (usable only in the run that found it, if verified), or **block**
  (added to the blocked list; never surfaces again).

## 6. Insufficient evidence

If research cannot support the request and web fallback is
unavailable or declined, the run does not invent material. The user
is offered:

- a **narrower script** built only on the supported material (the
  system proposes the reduced scope/angle explicitly), or
- a clear **cannot-support explanation**: what was looked for, where,
  and what is missing.

The outcome and the gap are logged against the niche (feeds §4
prioritisation). Unsourced or invented claims/citations remain
impossible (Control Rule: never invent sources/claims).

## 7. Sensitive claims — health

Health-related material gets stricter handling:

- Health claims default to `riskLevel` **high or above** and require
  tier-1/2 sourcing or explicit traditional-use framing.
- **Traditional Ayurvedic claims are distinguished from evidence of
  medical effectiveness or safety.** A claim sourced from a classical
  text or tradition is recorded and worded as such ("traditionally
  used for…", "described in <text> as…") — never restated as proven
  medical effect. Effectiveness/safety claims require clinical-grade
  sources under the verification standard.
- Any run whose research contains high/critical health claims keeps
  the existing **human-review gate**: research cannot be approved
  until a person reviews those claims (matches the Ayurveda/Health
  question-pack rule and Bible §13 cautious-language standard).

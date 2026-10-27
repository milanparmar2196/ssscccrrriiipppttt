# AI Model Providers — Registry, Models & Stage Assignment (2026-10-27)

The platform generates everything through LLMs, so the provider
layer is Admin-managed configuration — fully dynamic, like the
Question Library. Prompt templates already assigned "a model" per
step (Admin §9); this doc adds the missing layer underneath: **which
providers exist, which models each offers, and which provider+model
serves which pipeline stage.**

## 1. Provider registry (Admin `/model-providers`)

Built-in provider presets (one click to enable; base URLs prefilled):

| Provider | Notes |
|---|---|
| OpenAI | GPT family |
| Anthropic (Claude) | Claude family |
| Google (Gemini) | Gemini family |
| xAI (Grok) | Grok family |
| Zhipu (GLM) | GLM family |
| Moonshot (Kimi) | Kimi family |
| DeepSeek | DeepSeek family |
| Alibaba (Qwen) | Qwen family |
| Meta (Llama) | Llama models via a hosted endpoint (Meta's own API or an aggregator) — "Meta" and "Llama" are one provider entry |
| Xiaomi (MiMo) | MiMo family |
| MiniMax | MiniMax family |
| **Custom endpoint** | Any OpenAI-compatible base URL (local models, aggregators like OpenRouter, self-hosted) — name + base URL + key env name |

Provider record: `{ providerId, name, kind: builtin|custom,
baseUrl, apiKeyEnv, status: connected|missing_key|error,
enabled }`. **API keys live only in the server `.env`** (same rule
as admin credentials, Q4 decision): Admin UI shows masked status and
a **Test connection** button — keys are never typed into, stored in,
or shown by the UI/database. New providers can also be added as
custom entries — no code change, no cap.

## 2. Model catalogue (per provider, Admin-managed)

Model record: `{ modelId, providerId, displayName, contextWindow,
supportsJson (structured output), supportsVision, costTier:
low|standard|premium, status: active|deprecated }`. Seeded with
each provider's current models at build time; Admin can add/edit
models as providers release them (models change faster than code).

## 3. Stage assignment (the working configuration)

Every generation stage gets an assignment
`{ stage, providerId, modelId, params (temperature etc.),
fallbackChain: [ {providerId, modelId}, … ] }`:

Stages: topic generation, topic scoring, research, Bible draft,
outline, script drafting, scene breakdown, narration polish, visual
prompt writing, **audit (each area)**, fix/revision, package text,
asset research (16), publishing text (17), performance insights.

- Different stages can use different models — e.g. a strong
  reasoning model for Audit + Research, a fast/cheap model for
  topic scoring, a creative model for script drafting.
- **Fallback chain:** if the primary provider errors or rate-limits,
  the job retries the next assignment in the chain (logged; the Job
  records what actually ran).
- **Audit independence, enforced here:** the audit stages' assignment
  must not be the same model instance that drafted the content where
  avoidable — the assignment UI warns when audit stage = drafting
  stage model (conduct rule from the Phase 5 adoption).
- Prompt templates (Admin §9) reference the stage assignment; a
  template's model is its stage's assignment.
- **Overrides:** a Niche Template may override stage assignments for
  its niche; a run's **Generator Profile** snapshots the exact
  provider+model+params used per stage — reproducibility like every
  other snapshot in the system.

## 4. Usage & cost tracking

Every Job records `{ providerId, modelId, promptVersion, tokensIn,
tokensOut }`; Admin monitoring aggregates cost/usage by provider,
model, stage, niche and user (feeds the Audit Quality Center's
"score by model/prompt version" view). Credits charged to users stay
in platform credits (Admin §10) — provider token costs are an
internal metric, never a user-facing currency conversion.

## 5. Embeddings & similarity (A2 — added 2026-10-27)

User decision: **embedding models live inside this Model Providers
system**, with vectors stored in the main database (pgvector). The
catalogue gains `modelType: embedding` records `{ dimensions,
languages[] / multilingual, maxInputTokens }`, and the stage
assignments gain one **embedding assignment** `{ providerId, modelId,
fallbackChain[] }`.

**What gets embedded:** topics (title + angle + story question),
Do-Not-Repeat entries, and written scripts (per script + per scene
text). Each stored vector records the `modelId` + model version that
produced it. **Access boundary:** similarity queries are always
scoped to the owning user — comparisons run across that user's own
projects/channels only, never across users.

**Uses:** (1) topic deduplication candidates at Steps 4–5, (2)
Do-Not-Repeat matching, (3) script originality checks at Step 12
(against the channel's previously written scripts; the external
comparison standard for outside works is unchanged). Semantic scores
are **combined with keyword/exact signals** (title overlap, named
entities, exact phrases) — both are shown.

**Scores are indicators, not verdicts.** The user always sees the
matching items, their scores, and enough context to compare, and may
**continue anyway** when topics are intentionally related (the
acknowledgement is recorded). Nothing is auto-deleted or auto-
rejected on a score alone.

**Thresholds:** Admin-configurable, **separately per purpose**
(topic dedupe / Do-Not-Repeat / originality). Shipped defaults are
provisional: they must be calibrated against representative
Hindi + English example pairs (the assigned model must be
multilingual, Hindi included) before being treated as defaults;
Admin shows the thresholds + calibration date.

**Model changes & re-indexing:** changing the embedding assignment
marks existing vectors stale and queues an **Admin re-index job**
(scope: all / per project / per entity type). Until re-indexing
completes, checks report their model state honestly.

**Unavailable providers:** if no embedding model is assigned or the
provider is down, checks return `semanticStatus: unavailable`; a
keyword/exact-only pass may run and is labelled `keyword_only`. **No
surface may report content as "original" or "clear" unless the
required checks actually ran** — the Audit originality check shows
*Not completed*, and Final Approval then needs the check completed
or a recorded override flag (existing gate pattern).

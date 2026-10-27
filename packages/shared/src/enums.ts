/**
 * Canonical enums for the AI Script Writer platform.
 * Source of truth: packages/shared/SPEC.md §3 (+ the decisions it cites).
 * No app may define a local copy of any of these (SPEC Rules).
 *
 * Convention: every enum ships as a runtime const array (for validation,
 * seeds and UI rendering) plus a union type derived from it.
 */

export const PROJECT_TYPES = ["personal", "brand"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PLATFORMS = [
  "youtube_long",
  "youtube_shorts",
  "reels",
  "tiktok",
  "podcast_script",
  "other",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CLAIM_STATUSES = [
  "verified_fact",
  "assumption",
  "speculation",
  "conflicting",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

/**
 * TopicStatus / LicenseStatus: the specs name these enums without
 * enumerating values (Shared SPEC §3). The values below are the
 * scaffold definitions, grounded in the pipeline (Topic List ->
 * Evaluation & Selection -> used by a run) and in AssetItem licensing
 * (Master List 7). Confirm/extend when the topics and assets features
 * are specced; changing them is a shared-package version bump.
 */
export const TOPIC_STATUSES = [
  "candidate",
  "shortlisted",
  "selected",
  "rejected",
  "used",
] as const;
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

export const LICENSE_STATUSES = [
  "owned",
  "licensed",
  "public_domain",
  "unknown",
] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

/** JobStatus (Shared §3; cancellation + credit rules: API §7). */
export const JOB_STATUSES = [
  "queued",
  "running",
  "done",
  "failed",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** JobAction — one value per Job-creating endpoint (API §7). */
export const JOB_ACTIONS = [
  "topic_generate",
  "topic_evaluate",
  "research_run",
  "bible_generate",
  "outline_generate",
  "script_generate",
  "scene_generate",
  "audit_run",
  "audit_autofix",
  "package_generate",
  "asset_research",
  "publishing_generate",
  "insights_generate",
  "embedding_index",
  "export_generate",
] as const;
export type JobAction = (typeof JOB_ACTIONS)[number];

export const PACKAGE_STATUSES = ["ready", "outdated"] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

/** `na` always carries a reason (Shared §3) — never a silent skip. */
export const AUDIT_CHECK_STATUSES = ["pass", "fail", "warn", "na"] as const;
export type AuditCheckStatus = (typeof AUDIT_CHECK_STATUSES)[number];

/** AuditAreaKey — owned by this package (A4). brandCompliance: Brand only. */
export const AUDIT_AREA_KEYS = [
  "factualAccuracy",
  "sourceReliability",
  "originality",
  "narrativeCoherence",
  "engagement",
  "pacing",
  "continuity",
  "productionFeasibility",
  "repetition",
  "durationFit",
  "bibleCompliance",
  "brandCompliance",
] as const;
export type AuditAreaKey = (typeof AUDIT_AREA_KEYS)[number];

/** LifecycleStatus (D3; semantics in API §4A). */
export const LIFECYCLE_STATUSES = [
  "active",
  "archived",
  "pending_deletion",
  "deleted",
] as const;
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export const STAGE_STATUSES = [
  "locked",
  "ready",
  "in_progress",
  "awaiting_approval",
  "done",
  "needs_revision",
  "blocked",
] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

/** The 11 registry types (A3). Angle lives on the niche, not here. */
export const REGISTRY_TYPES = [
  "character",
  "place",
  "knowledge",
  "caseEvent",
  "creature",
  "storyWorld",
  "organisation",
  "product",
  "concept",
  "work",
  "propsWardrobe",
] as const;
export type RegistryType = (typeof REGISTRY_TYPES)[number];

/** The 7 Bible Master Lists (project-level, never locked in a version). */
export const BIBLE_MASTER_LIST_KEYS = [
  "sourceList",
  "doNotRepeat",
  "masterTimeline",
  "locationSettings",
  "hookOpeningLibrary",
  "phraseBank",
  "assetSourceList",
] as const;
export type BibleMasterListKey = (typeof BIBLE_MASTER_LIST_KEYS)[number];

/** Research retrieval modes (A1; curated_first is the default). */
export const RESEARCH_MODES = [
  "curated_first",
  "curated_only",
  "web_only",
  "selected_only",
] as const;
export type ResearchMode = (typeof RESEARCH_MODES)[number];

/** A5: credibility tier 1-5 (5 = do-not-use); null = needs tier review. */
export type CredibilityTier = 1 | 2 | 3 | 4 | 5;

export const SOURCE_REVIEW_STATUSES = ["approved", "pending", "blocked"] as const;
export type SourceReviewStatus = (typeof SOURCE_REVIEW_STATUSES)[number];

export const SOURCE_ORIGINS = [
  "library",
  "project",
  "user_supplied",
  "web_discovered",
] as const;
export type SourceOrigin = (typeof SOURCE_ORIGINS)[number];

export const SOURCE_AVAILABILITY = ["enabled", "disabled", "inaccessible"] as const;
export type SourceAvailability = (typeof SOURCE_AVAILABILITY)[number];

/** Embedding-check status (A2). Originality is never "clear" unless complete. */
export const SEMANTIC_STATUSES = [
  "complete",
  "keyword_only",
  "unavailable",
  "stale_model",
] as const;
export type SemanticStatus = (typeof SEMANTIC_STATUSES)[number];

/** Source Library niche coverage (A1) — a reviewed judgement, not a count. */
export const NICHE_COVERAGE_STATES = [
  "not_assessed",
  "needs_sources",
  "partial",
  "ready",
] as const;
export type NicheCoverageState = (typeof NICHE_COVERAGE_STATES)[number];

/** Fully dynamic configuration questions (Shared §1A). */
export const QUESTION_TYPES = [
  "single_choice",
  "multi_choice",
  "text",
  "long_text",
  "number",
  "boolean",
  "scale",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_SCOPES = ["global", "niche", "sub_niche", "project", "run"] as const;
export type QuestionScope = (typeof QUESTION_SCOPES)[number];

/** Admin roles (A9). `bootstrap` is an audit actor identity, not a role. */
export const ADMIN_ROLES = ["admin", "super_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const UPLOAD_STATES = [
  "initiated",
  "uploaded",
  "verified",
  "failed",
  "expired",
] as const;
export type UploadState = (typeof UPLOAD_STATES)[number];

export const YOUTUBE_CONNECTION_STATUSES = [
  "connected",
  "reauth_required",
  "quota_exceeded",
  "disconnected",
] as const;
export type YoutubeConnectionStatus = (typeof YOUTUBE_CONNECTION_STATUSES)[number];

export const PROPOSED_BIBLE_EDIT_STATUSES = ["pending", "approved", "rejected"] as const;
export type ProposedBibleEditStatus = (typeof PROPOSED_BIBLE_EDIT_STATUSES)[number];

/** Brand approval flow (Brand projects; D1: solo owner in MVP). */
export const BRAND_APPROVAL_STATES = [
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "final",
] as const;
export type BrandApprovalState = (typeof BRAND_APPROVAL_STATES)[number];

/** Legal risk on scenes/claims (docs/SCENE_BREAKDOWN.md §1). */
export const LEGAL_RISK_FLAGS = ["none", "low", "moderate", "high"] as const;
export type LegalRiskFlag = (typeof LEGAL_RISK_FLAGS)[number];

/** Project setting: pause scene generation after the first range for review. */
export const SCENE_REVIEW_MODES = ["auto", "first_range_review"] as const;
export type SceneReviewMode = (typeof SCENE_REVIEW_MODES)[number];

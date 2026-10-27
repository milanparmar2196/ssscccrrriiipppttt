/**
 * Production DTOs: Brand, topics, research, outline, script, scenes,
 * audit, package, performance, jobs (Shared SPEC §2).
 */
import type { BaseEntity, VersionedEntity } from "./core.js";
import type {
  AuditAreaKey,
  AuditCheckStatus,
  BrandApprovalState,
  ClaimStatus,
  CredibilityTier,
  JobAction,
  JobStatus,
  LegalRiskFlag,
  LicenseStatus,
  LifecycleStatus,
  NicheCoverageState,
  PackageStatus,
  Platform,
  ResearchMode,
  SemanticStatus,
  SourceAvailability,
  SourceOrigin,
  SourceReviewStatus,
  TopicStatus,
} from "../enums.js";

/** ---- Brand (builds after Personal MVP; collaboration deferred, D1) ---- */

export interface BrandProfile extends BaseEntity {
  ownerId: string;
  name: string;
  voice: Record<string, unknown>;
  audience: Record<string, unknown>;
  guidelines: Record<string, unknown>;
  lifecycleStatus: LifecycleStatus;
}

export interface Product extends BaseEntity {
  brandId: string;
  name: string;
  facts: Record<string, unknown>; // brand/fact-locked at generation time
}

export interface BrandGuideline extends BaseEntity {
  brandId: string;
  kind: "guideline" | "compliance";
  text: string;
  locked: boolean;
}

export interface Campaign extends BaseEntity {
  brandId: string;
  name: string;
  isSystemDefault?: boolean; // the "Uncategorised" default campaign
}

export interface BrandApprovalTransition extends BaseEntity {
  runId: string;
  from: BrandApprovalState;
  to: BrandApprovalState;
  actorId: string;
  note?: string; // required on changes_requested (D1)
}

/** ---- Topics (Steps 4-5) ---- */

export interface TopicScores {
  demand?: number;
  competition?: number;
  fit?: number;
  originality?: number;
  total?: number;
}

export interface Topic extends BaseEntity {
  projectId: string;
  title: string;
  angleId?: string | null; // null = story-question-only run path (visible)
  storyQuestion?: string;
  scores?: TopicScores;
  status: TopicStatus;
  possibleDuplicateAcknowledged?: boolean; // POSSIBLE_DUPLICATE flow (API §2)
}

/** ---- Research (Step 7 + A1 + A2) ---- */

export interface Source extends BaseEntity {
  title: string;
  url?: string;
  origin: SourceOrigin;
  /** A5: three separate fields — never conflate. */
  credibilityTier: CredibilityTier | null; // null = needs_tier_review
  reviewStatus: SourceReviewStatus; // per scope; broader block always wins
  availability: SourceAvailability;
}

export interface SourceLibraryEntry extends Source {
  bundleKeys: string[];
  coverageNote?: string;
}

export interface SourceBundle extends BaseEntity {
  key: string;
  label: string;
  sourceIds: string[];
}

export interface NicheCoverage extends BaseEntity {
  nicheId: string;
  state: NicheCoverageState;
  assessedBy?: string;
  note?: string;
}

export interface Claim extends BaseEntity {
  briefId: string;
  text: string;
  status: ClaimStatus;
  sourceIds: string[];
  /** Passage-level provenance (Phase 1 strengthening). */
  sourceLocation?: string;
  accessedAt?: string;
  confidence?: "high" | "medium" | "low";
  riskLevel?: LegalRiskFlag;
  conflictResolution?: string;
}

export interface ResearchGap {
  part: string;
  reason: string;
  resolution: "narrower_script" | "cannot_support" | "web_fallback_approved";
}

export interface ResearchBrief extends VersionedEntity {
  runId: string;
  mode: ResearchMode;
  summary: string;
  claimIds: string[];
  gaps: ResearchGap[];
  legalFlags: LegalRiskFlag;
}

/** A2 similarity result — an indicator, never an automatic rejection. */
export interface SimilarityMatch {
  entityType: "topic" | "script" | "do_not_repeat";
  entityId: string;
  title: string;
  semanticScore?: number;
  keywordScore?: number;
  context: string;
}

export type { SemanticStatus };

/** ---- Outline & Script (Steps 9-10) ---- */

export interface OutlineSection {
  key: string;
  title: string;
  purpose: string;
  claimIds: string[];
  beatNotes?: string;
}

export interface Outline extends VersionedEntity {
  runId: string;
  structureKey?: string;
  sections: OutlineSection[];
  /** Run total — the ONLY place estimatedDurationSec is used. */
  estimatedDurationSec?: number;
}

export interface ScriptSection extends BaseEntity {
  scriptId: string;
  sectionKey: string;
  narration: string;
  wordCount: number;
}

export interface Script extends VersionedEntity {
  runId: string;
  sections: ScriptSection[];
  totalWordCount: number;
  estimatedDurationSec: number;
  brandApprovalState?: BrandApprovalState; // Brand projects only
}

/** ---- Scenes (Step 11; canonical field list: API §6 Step 11) ---- */

export interface DataVizSeries {
  label: string;
  unit: string;
  values?: number[];
  points?: Array<{ x: number | string; y: number }>;
  sourceRef: { kind: "verifiedData" | "claim"; id: string };
}

export interface DataVizSpec {
  schemaVersion: number;
  vocabularyVersion: number;
  chartType: string; // from the Admin-managed vocabulary
  purpose: string;
  series: DataVizSeries[];
  categoryLabels?: string[];
  timePeriod?: string;
  axis: {
    xLabel: string;
    yLabel: string;
    scale: "linear" | "log";
    min?: number;
    max?: number;
    startAtZero: boolean;
  };
  sourceNote: string; // mandatory on-chart source line
  accessibility: { keyFindingText: string; contrastChecked: boolean };
  animationNote?: string;
  narrateAfterAnimation: boolean;
}

export interface DataVizRequest extends BaseEntity {
  sceneId: string;
  requestedType: string;
  note?: string;
  status: "draft" | "in_admin_review" | "resolved";
}

export interface Scene extends BaseEntity {
  runId: string;
  sceneNo: number; // sequential, no gaps
  chapterId?: string;
  sectionKey?: string;
  purpose: string;
  narration: string;
  speakerLabel: string;
  voWordCount: number;
  estimatedVoSec: number;
  visualDirection: string;
  shotDescription?: string;
  shotType?: string;
  cameraMove?: string;
  animationNote?: string;
  shotRecipeId?: string;
  footageRequirement?: string;
  aiImagePrompt?: string;
  aiVideoPrompt?: string;
  onScreenText?: string; // explicit "none" decision counts (Production Detail Standard)
  editorialOverlayInstructions?: string;
  referenceInputs: string[];
  continuityState: { startState: string; endState: string };
  registryRefs: {
    characterIds: string[];
    locationIds: string[];
    propIds: string[];
  };
  periodLabel?: string;
  claimIds: string[];
  sourceRefs: string[];
  legalRiskFlag: LegalRiskFlag;
  dataVizSpec?: DataVizSpec;
  sfx: string[];
  musicCue?: string;
  transition?: string;
  durationEstSec: number;
  retentionNote?: string;
}

/** ---- Audit (Steps 12-13; A4 weighted scoring) ---- */

export interface AuditWeightConfig extends VersionedEntity {
  scope: "standard" | "brand";
  /** Weights per area; applicable weights must sum to exactly 100. */
  weights: Partial<Record<AuditAreaKey, number>>;
}

export interface AuditAreaResult {
  area: AuditAreaKey;
  score: number; // 0-10
  weight: number; // configured
  effectiveWeight: number; // after proportional redistribution of N/A areas
  notApplicable?: boolean;
  unassessable?: boolean; // required + unassessable => audit incomplete
}

export interface AuditCheck extends BaseEntity {
  reportId: string;
  area: AuditAreaKey;
  key: string;
  status: AuditCheckStatus;
  critical: boolean;
  naReason?: string; // required when status = na
  detail?: string;
}

/** Editorial Depth is a per-deliverable verdict layer — never scored. */
export interface DeliverableVerdict {
  deliverableKey: string;
  verdict: "ready" | "needs_work";
  note?: string;
}

export interface AuditReport extends VersionedEntity {
  runId: string;
  areas: AuditAreaResult[];
  total?: number; // absent while completeness = incomplete
  weightConfigVersion: number;
  completeness: "complete" | "incomplete";
  blockedByCritical: boolean;
  checks: AuditCheck[];
  deliverableVerdicts: DeliverableVerdict[];
  semanticStatus: SemanticStatus; // originality is never "clear" unless checks ran
}

/** ---- Package (Step 14; canonical list in deliverables.ts) ---- */

export interface PackageFile {
  deliverableKey: string;
  fileName: string;
  storageKey: string;
  checksum: string;
}

export interface ProductionPackage extends VersionedEntity {
  runId: string;
  status: PackageStatus;
  deliverableKeys: string[]; // validated against PACKAGE_DELIVERABLES
  files: PackageFile[];
  manifest: Record<string, unknown>; // records embedded structured-first
}

/** Per-run snapshot of everything that generated the run (Phase 2 G10). */
export interface GeneratorProfile extends BaseEntity {
  runId: string;
  bibleVersionId: string;
  characterSnapshotId?: string;
  configSchemaVersion: number;
  stageModels: Array<{
    stage: string;
    providerId: string;
    modelId: string;
    fallbackUsed?: string;
  }>;
  formatProfileKey?: string;
  dataVizSchemaVersion?: number;
  dataVizVocabularyVersion?: number;
}

/** ---- Performance (Step 15; N-1 with runs, full history kept) ---- */

export interface PerformanceRecord extends BaseEntity {
  runId: string;
  platform: Platform;
  youtubeVideoId?: string; // matching is by this user-set id only (A10)
  source: "youtube_sync" | "manual" | "csv";
  metrics: Record<string, number>;
  recordedAt: string;
}

export interface PerformanceInsight extends BaseEntity {
  projectId: string;
  text: string;
  status: "proposed" | "approved" | "rejected"; // approval creates a Bible version
}

/** ---- Optional modules 16-17 ---- */

export interface AssetItem extends BaseEntity {
  runId: string;
  kind: "image" | "footage" | "music" | "sfx" | "font" | "other";
  title: string;
  sourceUrl?: string;
  licenseStatus: LicenseStatus;
  licenseNote?: string;
  checksum?: string;
}

export interface PublishingOutput extends BaseEntity {
  runId: string;
  platform: Platform;
  title?: string;
  description?: string;
  tags: string[];
  pinnedComment?: string;
  attachedToPackage: boolean; // generated before PACKAGE => joins it; after => addendum
}

/** ---- Jobs & issues ---- */

export interface Job extends BaseEntity {
  userId: string;
  action: JobAction;
  status: JobStatus;
  projectId?: string;
  runId?: string;
  estimatedCredits: number;
  actualCredits?: number;
  unitsTotal?: number;
  unitsDone?: number;
  tokensUsed?: number;
  modelUsed?: string; // fallback-model work is charged at the model actually used
  errorCode?: string;
}

export interface OpenIssue extends BaseEntity {
  runId?: string;
  projectId?: string;
  kind: string;
  detail: string;
  /** Workflow Rule 11: unresolved issues are flagged explicitly, never hidden. */
  resolvedAt?: string | null;
}

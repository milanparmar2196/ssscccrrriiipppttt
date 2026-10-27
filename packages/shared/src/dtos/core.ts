/**
 * Core DTOs: users, plans, credits, projects, taxonomy shapes and the
 * fully dynamic configuration system (Shared SPEC §1A + §2).
 * Money/credits are integers — no floats (SPEC §2).
 */
import type {
  LifecycleStatus,
  Platform,
  ProjectType,
  QuestionScope,
  QuestionType,
  RegistryType,
} from "../enums.js";

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface VersionedEntity extends BaseEntity {
  versionNo: number;
  isCurrent: boolean;
}

export interface User extends BaseEntity {
  email: string;
  displayName?: string;
  emailVerifiedAt?: string | null;
  suspendedAt?: string | null;
}

export interface Plan extends BaseEntity {
  key: string;
  label: string;
  /** Internal Admin-managed entitlement (no billing provider, 2026-10-27). */
  creditAllowance: number;
  features: Record<string, boolean>;
}

/** Credit ledger entries are append-only and survive project deletion (D3). */
export interface CreditLedgerEntry extends BaseEntity {
  userId: string;
  kind: "grant" | "hold" | "charge" | "release" | "restoration" | "purchase";
  amount: number; // signed integer credits
  jobId?: string;
  note?: string;
  actor: string; // user id | admin id | "bootstrap" | "system"
}

export interface WorkspaceProject extends BaseEntity {
  ownerId: string;
  type: ProjectType;
  name: string;
  nicheId?: string;
  subNicheId?: string;
  platform: Platform;
  lifecycleStatus: LifecycleStatus;
  isSample?: boolean; // read-only sample project (D2)
  sceneReviewMode: "auto" | "first_range_review";
}

/** Taxonomy is data, not an enum — shapes only (fully dynamic, §1A). */
export interface Niche extends BaseEntity {
  /** Unique stable id (clean split 2026-10-27); legacyId may repeat. */
  legacyId?: number | null;
  name: string;
  categoryKey: string;
  archivedAt?: string | null;
}

export interface SubNiche extends BaseEntity {
  nicheId: string;
  legacyId?: number | null;
  name: string;
  overrides?: Record<string, unknown>;
  archivedAt?: string | null;
}

export interface AudienceStrategy extends BaseEntity {
  projectId: string;
  persona: string;
  channelPromise: string;
  notes?: string;
}

/** ---- Fully dynamic configuration questions (§1A) ---- */

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionCondition {
  questionKey: string;
  operator: "equals" | "not_equals" | "in" | "not_in";
  value: string | string[];
}

export interface ConfigQuestion extends BaseEntity {
  key: string; // unique, stable
  version: number;
  scope: QuestionScope;
  label: string;
  helpText?: string;
  type: QuestionType;
  options?: QuestionOption[];
  required: boolean;
  defaultValue?: unknown;
  condition?: QuestionCondition;
  /** Bible/config field this answer projects onto (answers win, API §6A). */
  mapsTo?: string;
  /** "Other — write your own" (v2.2); locked off only by law/policy. */
  allowCustomAnswer: boolean;
  customAnswerLabel?: string;
  archivedAt?: string | null;
}

/** A stored answer: the source of truth (typed fields are projections). */
export type ConfigAnswerValue =
  | { value: string }
  | { value: "custom"; customText: string }
  | { value: string[] }
  | { value: number }
  | { value: boolean }
  | { value: string; customText?: string };

export interface ConfigAnswer {
  questionKey: string;
  schemaVersion: number;
  answer: ConfigAnswerValue;
}

/** Niche-wise reuse: link a library question into a niche (assign) or copy it (clone). */
export interface NicheQuestionAssignment extends BaseEntity {
  questionId: string;
  nicheId: string;
  subNicheId?: string;
  mode: "assigned" | "cloned";
  order: number;
  requiredOverride?: boolean;
  defaultOverride?: unknown;
}

export interface PresetItem {
  key: string;
  label: string;
  description?: string;
  version: number;
}

/** ---- Niche Templates (10 independently applicable sections, A8) ---- */

export interface TemplateRegistriesSection {
  mode: "explicit";
  primary: RegistryType;
  secondary: RegistryType[];
}

export interface NicheTemplateSections {
  strategyDefaults?: Record<string, unknown>;
  configurationDefaults?: Record<string, unknown>;
  bibleTemplate?: Record<string, unknown>;
  questionsSetRef?: string;
  researchTemplate?: Record<string, unknown>;
  structureTemplates?: Record<string, unknown>;
  sceneTemplate?: Record<string, unknown>;
  auditAddons?: Record<string, unknown>;
  packagingDefaults?: Record<string, unknown>;
  /** null/absent = inherit (override -> category map); explicit replaces. */
  registries?: TemplateRegistriesSection | null;
}

export interface NicheTemplate extends VersionedEntity {
  nicheId: string;
  subNicheId?: string;
  scope: "global" | "personal";
  ownerId?: string; // set when scope = personal
  isDefault: boolean;
  sections: NicheTemplateSections;
}

/** Per-niche registry override (Admin level, seeded from Registry Map Part C). */
export interface NicheRegistryOverride extends BaseEntity {
  nicheId: string;
  primary?: RegistryType;
  secondary?: RegistryType[];
  note?: string;
}

/** Project configuration = the Layer A answers + their typed projection. */
export interface ProjectConfiguration extends BaseEntity {
  projectId: string;
  answers: ConfigAnswer[];
  schemaVersion: number;
}

export interface ToneConfig {
  presetKey?: string;
  customText?: string;
}

export interface LanguageConfig {
  language: string;
  script?: string;
  mixedLanguages?: string[];
}

export interface VisualStyleConfig {
  archetypeId?: string;
  archetypeVersion?: number;
  overrides?: Record<string, string>;
}

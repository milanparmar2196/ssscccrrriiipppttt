/**
 * Admin + platform DTOs (Shared SPEC §2): A9 admin identity, A10
 * platform records, and the AI model provider layer.
 */
import type { BaseEntity } from "./core.js";
import type {
  AdminRole,
  ProposedBibleEditStatus,
  UploadState,
  YoutubeConnectionStatus,
} from "../enums.js";

/** A9: regular admins are DB records; passwords are hashed, never serialised. */
export interface AdminUser extends BaseEntity {
  email: string;
  /** Never serialised to any client — present only in the persistence layer. */
  passwordHash?: never;
  role: AdminRole;
  status: "active" | "disabled";
  mfaEnabled: boolean;
  mfaSecretRef?: string;
}

/** The reserved audit actor for bootstrap-credential actions (A9). */
export const BOOTSTRAP_ACTOR = "bootstrap" as const;

/** Issued at Final Approval; immutable, superseded on re-approval (A10). */
export interface CompletionCertificate extends BaseEntity {
  runId: string;
  issuedAt: string;
  supersededById?: string;
  data: Record<string, unknown>;
}

/** Append-only (A10). */
export interface CorrectionsLogEntry extends BaseEntity {
  runId: string;
  field: string;
  before: string;
  after: string;
  reason: string;
  actorId: string;
}

export interface Upload extends BaseEntity {
  ownerId: string;
  fileName: string;
  sizeBytes: number;
  sha256?: string;
  state: UploadState;
  malwareScan: "not_configured" | "pending" | "clean" | "flagged";
}

/** Status fields only — token material is never part of any DTO (A10). */
export interface YoutubeConnection extends BaseEntity {
  userId: string;
  channelRef: string;
  scopes: string[]; // youtube.readonly + yt-analytics.readonly only
  status: YoutubeConnectionStatus;
  lastSyncedAt?: string;
}

export interface WebhookSubscription extends BaseEntity {
  userId: string;
  url: string;
  events: string[];
  /** Shown once at creation/rotation; stored hashed, never returned again. */
  secretHash?: never;
  enabled: boolean;
}

/** The only path from a proposal into the Bible: approve -> new version (A10). */
export interface ProposedBibleEdit extends BaseEntity {
  projectId: string;
  targetSection: string;
  diff: Record<string, unknown>;
  status: ProposedBibleEditStatus;
  sourceRunId?: string;
}

/** ---- AI model providers (docs/MODEL_PROVIDERS.md) ---- */

export interface ModelProvider extends BaseEntity {
  key: string; // openai | anthropic | google | xai | zhipu | moonshot | deepseek | alibaba | meta | xiaomi | minimax | custom
  label: string;
  baseUrl?: string;
  /** Keys live only in server .env; the UI sees masked status, never the key. */
  envKeyName: string;
  enabled: boolean;
  keyConfigured: boolean;
}

export interface ProviderModel extends BaseEntity {
  providerId: string;
  modelId: string;
  label: string;
  modelType: "chat" | "embedding";
  contextWindow?: number;
  /** Seed models are inert until Admin activation (starter_unverified). */
  activationState: "starter_unverified" | "active" | "disabled";
}

export interface StageModelAssignment extends BaseEntity {
  stage: string; // pipeline stage key (research, outline, script, scenes, audit, ...)
  providerId: string;
  modelId: string;
  params: Record<string, unknown>;
  fallbackChain: Array<{ providerId: string; modelId: string }>;
  scope: "platform" | "niche_template";
  nicheTemplateId?: string;
}

/** Notification types (API §10). */
export const NOTIFICATION_TYPES = [
  "job_done",
  "job_failed",
  "audit_failed",
  "audit_passed",
  "credits_low",
  "package_ready",
  "export_ready",
  "verification_reminder",
  "deletion_scheduled",
  "deletion_cancelled",
  "admin_message",
  "webhook_disabled",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string | null;
  /** deletion_scheduled / deletion_cancelled can never be disabled (API §10). */
  disableable: boolean;
}

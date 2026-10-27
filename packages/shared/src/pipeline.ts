/**
 * The master pipeline (docs/WORKFLOW.md FINAL PIPELINE) and its mapping
 * to run stages (Shared SPEC §1 + §3). Renaming/reordering a step means
 * editing this file + docs/WORKFLOW.md only (SPEC Acceptance).
 */
import type { StageStatus } from "./enums.js";

export interface PipelineStep {
  stepNo: number;
  key: string;
  phase: number; // 1-8 for steps 1-15; 0 = optional module (16/17)
  label: string;
  approvalGate: boolean;
  optional: boolean;
}

export const PIPELINE_STEPS: readonly PipelineStep[] = [
  { stepNo: 1, key: "niche", phase: 1, label: "Niche", approvalGate: false, optional: false },
  { stepNo: 2, key: "sub_niche", phase: 1, label: "Sub-Niche", approvalGate: false, optional: false },
  { stepNo: 3, key: "audience_channel_strategy", phase: 1, label: "Audience & Channel Strategy", approvalGate: false, optional: false },
  { stepNo: 4, key: "topic_list", phase: 2, label: "Topic List", approvalGate: false, optional: false },
  { stepNo: 5, key: "topic_evaluation_selection", phase: 2, label: "Topic Evaluation & Selection", approvalGate: true, optional: false },
  { stepNo: 6, key: "configuration_questions", phase: 3, label: "Configuration Questions", approvalGate: false, optional: false },
  { stepNo: 7, key: "research_fact_verification", phase: 4, label: "Research & Fact Verification", approvalGate: true, optional: false },
  { stepNo: 8, key: "production_bible", phase: 4, label: "Production Bible", approvalGate: false, optional: false },
  { stepNo: 9, key: "narrative_structure_outline", phase: 5, label: "Narrative Structure & Outline", approvalGate: true, optional: false },
  { stepNo: 10, key: "script_drafting", phase: 5, label: "Script Drafting", approvalGate: false, optional: false },
  { stepNo: 11, key: "scene_breakdown", phase: 5, label: "Scene Breakdown", approvalGate: false, optional: false },
  { stepNo: 12, key: "audit_quality_control", phase: 6, label: "Audit & Quality Control", approvalGate: false, optional: false },
  { stepNo: 13, key: "revision_final_approval", phase: 6, label: "Revision & Final Approval", approvalGate: true, optional: false },
  { stepNo: 14, key: "production_package", phase: 7, label: "Production Package", approvalGate: false, optional: false },
  { stepNo: 15, key: "performance_feedback_loop", phase: 8, label: "Performance Feedback Loop", approvalGate: false, optional: false },
  { stepNo: 16, key: "visual_asset_research", phase: 0, label: "Visual & Asset Research", approvalGate: false, optional: true },
  { stepNo: 17, key: "platform_publishing_optimization", phase: 0, label: "Platform & Publishing Optimization", approvalGate: false, optional: true },
] as const;

export interface Phase {
  phase: number;
  label: string;
  stepNos: readonly number[];
  optional: boolean;
}

export const PHASES: readonly Phase[] = [
  { phase: 1, label: "Niche & Strategy", stepNos: [1, 2, 3], optional: false },
  { phase: 2, label: "Topic Development", stepNos: [4, 5], optional: false },
  { phase: 3, label: "Project Configuration", stepNos: [6], optional: false },
  { phase: 4, label: "Research & Foundation", stepNos: [7, 8], optional: false },
  { phase: 5, label: "Script Development", stepNos: [9, 10, 11], optional: false },
  { phase: 6, label: "Quality Control", stepNos: [12, 13], optional: false },
  { phase: 7, label: "Production Delivery", stepNos: [14], optional: false },
  { phase: 8, label: "Post-Publication Optimization", stepNos: [15], optional: false },
] as const;

/**
 * Run stages. Steps 1-3 are project-level (no run stage); step 8 is the
 * project Bible — the run snapshots it, so it has no run stage either.
 */
export const RUN_STAGES = [
  "topics",
  "config",
  "research",
  "outline",
  "script",
  "scenes",
  "audit",
  "package",
  "performance",
  "assets",
  "publishing",
] as const;
export type RunStage = (typeof RUN_STAGES)[number];

/** Pipeline step -> run stage (null = project-level / snapshot, no stage). */
export const PIPELINE_STEP_TO_STAGE: Readonly<Record<number, RunStage | null>> = {
  1: null,
  2: null,
  3: null,
  4: "topics",
  5: "topics",
  6: "config", // + the bible_confirm gate when a newer Bible version exists (API §4)
  7: "research",
  8: null,
  9: "outline",
  10: "script",
  11: "scenes",
  12: "audit",
  13: "audit",
  14: "package",
  15: "performance",
  16: "assets",
  17: "publishing",
};

/** Stages that must be `done` before a stage can start (API enforces). */
export const STAGE_DEPENDENCIES: Readonly<Record<RunStage, readonly RunStage[]>> = {
  topics: [],
  config: ["topics"],
  research: ["config"],
  outline: ["research"],
  script: ["outline"],
  scenes: ["script"],
  audit: ["scenes"],
  package: ["audit"],
  performance: ["package"],
  assets: ["scenes"],
  publishing: ["package"],
};

/** The stages gated by a user approval (WORKFLOW Control Rules). */
export const APPROVAL_STAGES: readonly RunStage[] = [
  "topics", // topic selection (step 5)
  "research", // research approval (step 7)
  "outline", // outline approval (step 9)
  "audit", // final approval (step 13, inside the audit stage)
] as const;

/** A run's stage map as returned by the API (web/admin render, never decide). */
export type StageMap = Partial<Record<RunStage, StageStatus>>;

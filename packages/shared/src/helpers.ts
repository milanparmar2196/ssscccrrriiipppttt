/**
 * Pure helpers (Shared SPEC §5) — one implementation, used everywhere
 * the value is shown or checked. No I/O, no framework code.
 */
import { STAGE_DEPENDENCIES, type RunStage, type StageMap } from "./pipeline.js";
import type { Scene } from "./dtos/production.js";

/** Typical narration pace (docs/SCENE_BREAKDOWN.md: 140-160 WPM). */
export const DEFAULT_NARRATION_WPM = 150;

export interface Pacing {
  wordsPerMinute: number;
}

export function estimateDurationSec(wordCount: number, pacing: Pacing | number): number {
  const wpm = typeof pacing === "number" ? pacing : pacing.wordsPerMinute;
  if (!Number.isFinite(wordCount) || wordCount <= 0 || !Number.isFinite(wpm) || wpm <= 0) {
    return 0;
  }
  return Math.round((wordCount / wpm) * 60);
}

export interface SceneCompleteness {
  complete: boolean;
  gaps: string[];
}

/**
 * "Complete scene" is a derived check (Shared SPEC §4), used by the API
 * for stage gating and by web for the totals bar — same function.
 * Standard (API Step 11): narration, visualDirection, shot/camera
 * direction, an on-screen-text DECISION (explicit "none" counts),
 * durationEstSec, and a valid dataVizSpec where a chart is directed.
 */
export function isSceneComplete(scene: Scene): SceneCompleteness {
  const gaps: string[] = [];
  if (!scene.narration?.trim()) gaps.push("narration");
  if (!scene.visualDirection?.trim()) gaps.push("visualDirection");
  if (!scene.shotDescription?.trim() && !scene.cameraMove && !scene.shotType) {
    gaps.push("shot/camera direction");
  }
  if (scene.onScreenText === undefined) gaps.push("onScreenText decision");
  if (!scene.durationEstSec || scene.durationEstSec <= 0) gaps.push("durationEstSec");
  if (scene.dataVizSpec) {
    const spec = scene.dataVizSpec;
    if (!spec.chartType) gaps.push("dataVizSpec.chartType");
    if (!spec.sourceNote?.trim()) gaps.push("dataVizSpec.sourceNote");
    if (!spec.accessibility?.keyFindingText?.trim()) {
      gaps.push("dataVizSpec.accessibility.keyFindingText");
    }
    for (const [i, s] of spec.series.entries()) {
      if (!s.sourceRef?.id) gaps.push(`dataVizSpec.series[${i}] missing_evidence`);
    }
    if (
      (spec.chartType === "bar" || spec.chartType === "column") &&
      !spec.axis.startAtZero
    ) {
      gaps.push("dataVizSpec.axis.startAtZero (bar/column must start at zero)");
    }
  }
  return { complete: gaps.length === 0, gaps };
}

/** Presentation helpers over the API-returned stage map — never the decider. */
export function isStageLocked(stageMap: StageMap, stage: RunStage): boolean {
  if (stageMap[stage] === "locked") return true;
  return STAGE_DEPENDENCIES[stage].some((dep) => stageMap[dep] !== "done");
}

export function lockReason(stageMap: StageMap, stage: RunStage): string | null {
  if (!isStageLocked(stageMap, stage)) return null;
  if (stageMap[stage] === "locked") return "This stage is locked.";
  const missing = STAGE_DEPENDENCIES[stage].filter((dep) => stageMap[dep] !== "done");
  return `Complete ${missing.join(", ")} first.`;
}

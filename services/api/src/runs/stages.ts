/**
 * Stage-gate state machine (API §4). Stage keys/statuses come from
 * @scriptwriter/shared — never redefined here.
 */
import {
  RUN_STAGES,
  STAGE_DEPENDENCIES,
  type RunStage,
} from "@scriptwriter/shared";
import type { RunRecord } from "../platform/store.js";

export function initialStageMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const s of RUN_STAGES) map[s] = s === "topics" ? "ready" : "locked";
  return map;
}

/**
 * Recompute ready/locked from dependencies. Terminal/active states
 * (done, in_progress, awaiting_approval, needs_revision, blocked) are
 * preserved; only ready/locked are derived.
 */
export function recomputeLocks(stageMap: Record<string, string>): Record<string, string> {
  const next = { ...stageMap };
  for (const stage of RUN_STAGES) {
    const status = next[stage];
    if (status === "ready" || status === "locked" || status === undefined) {
      const deps = STAGE_DEPENDENCIES[stage];
      next[stage] = deps.every((d) => next[d] === "done") ? "ready" : "locked";
    }
  }
  return next;
}

export function setStage(
  run: RunRecord,
  stage: RunStage,
  status: string,
  actor: string,
  note?: string,
): Partial<RunRecord> {
  const stageMap = { ...run.stageMap, [stage]: status };
  const stageHistory = [
    ...run.stageHistory,
    { stage, status, actor, note, at: new Date().toISOString() },
  ];
  return { stageMap: recomputeLocks(stageMap), stageHistory };
}

/** §4 edit-invalidation: substantial edits push dependent stages back. */
export function invalidateForEdit(
  run: RunRecord,
  edited: "script" | "scenes" | "outline",
  actor: string,
): Partial<RunRecord> {
  let map = { ...run.stageMap };
  const history = [...run.stageHistory];
  const push = (stage: RunStage, status: string) => {
    if (map[stage] === "done" || map[stage] === "in_progress") {
      map[stage] = status;
      history.push({
        stage, status, actor,
        note: `invalidated by ${edited} edit (§4)`,
        at: new Date().toISOString(),
      });
    }
  };
  if (edited === "script" || edited === "scenes") {
    push("audit", "needs_revision");
    push("package", "needs_revision");
  }
  if (edited === "outline") {
    push("script", "needs_revision");
    push("scenes", "needs_revision");
    push("audit", "needs_revision");
    push("package", "needs_revision");
  }
  map = recomputeLocks(map);
  // needs_revision survives recompute only if we re-apply: recompute only
  // touches ready/locked, so the map above is already correct.
  return { stageMap: map, stageHistory: history };
}

export function stageOf(run: RunRecord, stage: RunStage): string {
  return run.stageMap[stage] ?? "locked";
}

export function assertStageMutable(run: RunRecord, stage: RunStage): void {
  const status = stageOf(run, stage);
  if (status === "locked") {
    const missing = STAGE_DEPENDENCIES[stage].filter((d) => stageOf(run, d as RunStage) !== "done");
    throw Object.assign(new Error(`Stage ${stage} is locked — complete ${missing.join(", ")} first`), {
      code: "STAGE_LOCKED",
    });
  }
}

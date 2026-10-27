/**
 * Audit engine (API §6 Step 12 + A4). Deterministic checks run
 * always; model-scored areas are merged by the handler when a model
 * is configured. Weighted total with proportional redistribution;
 * critical failures block passing; unassessable required areas make
 * the audit Incomplete. Editorial Depth is a verdict, never a score.
 */
import { isSceneComplete } from "@scriptwriter/shared";
import { PLATFORM_DEFAULTS } from "../platform/settings.js";

type Obj = Record<string, unknown>;

export interface AuditCheck {
  area: string;
  key: string;
  status: "pass" | "fail" | "warn" | "na";
  naReason?: string;
  critical?: boolean;
  message?: string;
  suggestion?: string;
  sceneNos?: number[];
}

export interface AreaResult {
  score: number | null;
  weight: number;
  checks: AuditCheck[];
  status?: string;
}

const CORE_NON_WAIVABLE = new Set(["identity", "evidence", "narration", "delivery", "review_records"]);

export function runDeterministicChecks(input: {
  scenes: Obj[];
  claims: Obj[];
  targetDurationSec?: number;
  estimatedDurationSec: number;
  brandProject: boolean;
  semanticStatus: string;
  originalityScore: number | null;
}): { checks: AuditCheck[]; editorialDepth: Record<string, string> } {
  const checks: AuditCheck[] = [];
  const { scenes, claims } = input;
  const verifiedClaims = new Map(
    claims.filter((c) => c.status === "verified_fact").map((c) => [String(c.id), c]),
  );

  // identity / narration / delivery (Production Detail Standard, core)
  const incomplete = scenes.filter((s) => !isSceneComplete(s as never).complete);
  checks.push({
    area: "productionFeasibility", key: "production_detail_complete",
    status: scenes.length === 0 ? "na" : incomplete.length === 0 ? "pass" : "fail",
    naReason: scenes.length === 0 ? "No scenes exist yet" : undefined,
    critical: incomplete.length > 0,
    message: incomplete.length
      ? `${incomplete.length} scene(s) miss production detail (narration, visual, camera, on-screen-text decision, duration, registry refs)`
      : "All scenes meet the Production Detail Standard",
    sceneNos: incomplete.map((s) => Number(s.sceneNo)),
  });

  // evidence: statistic-bearing narration must cite claims
  const statPattern = /\d+(\.\d+)?\s?(%|percent|million|billion|thousand)/i;
  const uncited = scenes.filter(
    (s) => statPattern.test(String(s.narration ?? "")) && ((s.claimIds as string[]) ?? []).length === 0,
  );
  checks.push({
    area: "factualAccuracy", key: "scenes_cite_claims",
    status: uncited.length === 0 ? "pass" : "fail",
    critical: uncited.length > 0,
    message: uncited.length
      ? `${uncited.length} scene(s) state statistics without citing a claim`
      : "Every statistic-bearing scene cites its claims",
    sceneNos: uncited.map((s) => Number(s.sceneNo)),
  });

  // superlatives require a named source
  const superPattern = /\b(first|only|largest|biggest|oldest|greatest|most)\b/i;
  const superNoSource = scenes.filter(
    (s) =>
      superPattern.test(String(s.narration ?? "")) &&
      ((s.claimIds as string[]) ?? []).every((id) => !verifiedClaims.has(id)),
  );
  checks.push({
    area: "factualAccuracy", key: "superlatives_sourced",
    status: superNoSource.length === 0 ? "pass" : "fail",
    critical: superNoSource.length > 0,
    message: superNoSource.length
      ? "Superlative claims (first/only/largest...) need a named verified source"
      : "Superlatives are sourced",
    sceneNos: superNoSource.map((s) => Number(s.sceneNo)),
  });

  // placeholders
  const placeholders = scenes.filter((s) =>
    /\[.*?\]|TODO|TBD|lorem/i.test(String(s.narration ?? "")),
  );
  checks.push({
    area: "narrativeCoherence", key: "zero_placeholders",
    status: placeholders.length === 0 ? "pass" : "fail",
    critical: placeholders.length > 0,
    message: placeholders.length ? "Placeholder text remains in narration" : "No placeholders",
    sceneNos: placeholders.map((s) => Number(s.sceneNo)),
  });

  // pacing: VO words vs duration at ~150wpm
  const badPacing = scenes.filter((s) => {
    const words = Number(s.voWordCount ?? String(s.narration ?? "").split(/\s+/).filter(Boolean).length);
    const dur = Number(s.durationEstSec ?? s.estimatedVoSec ?? 0);
    if (!dur) return false;
    const expected = dur * 2.5;
    return Math.abs(words - expected) > expected * 0.35;
  });
  checks.push({
    area: "pacing", key: "vo_word_budget",
    status: scenes.length === 0 ? "na" : badPacing.length === 0 ? "pass" : "warn",
    naReason: scenes.length === 0 ? "No scenes" : undefined,
    message: badPacing.length
      ? `${badPacing.length} scene(s) have VO word counts far outside their duration at Bible pacing`
      : "VO word budgets fit scene durations",
    sceneNos: badPacing.map((s) => Number(s.sceneNo)),
  });

  // dataViz validity (D4): every factual series linked
  const badViz = scenes.filter((s) => {
    const spec = s.dataVizSpec as Obj | undefined;
    if (!spec) return false;
    return ((spec.series as Obj[]) ?? []).some(
      (series) => series.sourceRef === undefined || series.sourceRef === null,
    );
  });
  checks.push({
    area: "factualAccuracy", key: "dataviz_linked",
    status: scenes.some((s) => s.dataVizSpec) ? (badViz.length === 0 ? "pass" : "fail") : "na",
    naReason: scenes.some((s) => s.dataVizSpec) ? undefined : "No chart scenes in this run",
    critical: badViz.length > 0,
    message: badViz.length
      ? "Chart series without a linked verified source (missing_evidence)"
      : "All chart data is linked to verified sources",
    sceneNos: badViz.map((s) => Number(s.sceneNo)),
  });

  // unresolved conflicting claims
  const conflicts = claims.filter((c) => c.status === "conflicting" && !c.conflictResolution);
  checks.push({
    area: "sourceReliability", key: "conflicts_resolved",
    status: conflicts.length === 0 ? "pass" : "fail",
    critical: conflicts.length > 0,
    message: conflicts.length
      ? `${conflicts.length} conflicting claim(s) unresolved`
      : "No unresolved claim conflicts",
  });

  // legal flags unresolved
  const legalOpen = scenes.filter(
    (s) => (s.legalRiskFlag === "high" || s.legalRiskFlag === "critical"),
  );
  checks.push({
    area: "bibleCompliance", key: "legal_flags_addressed",
    status: legalOpen.length === 0 ? "pass" : "warn",
    message: legalOpen.length
      ? `${legalOpen.length} scene(s) carry high/critical legal risk flags — confirm they are resolved or flagged in open issues`
      : "No open high-risk legal flags",
    sceneNos: legalOpen.map((s) => Number(s.sceneNo)),
  });

  // originality (A2): never "clear" unless semantic checks completed
  checks.push({
    area: "originality", key: "internal_similarity",
    status:
      input.semanticStatus === "complete"
        ? input.originalityScore !== null && input.originalityScore > 0.85
          ? "warn"
          : "pass"
        : "warn",
    message:
      input.semanticStatus === "complete"
        ? "Internal similarity check ran (semantic)"
        : `Semantic check status: ${input.semanticStatus} — originality is NOT reported clear; a recorded override is required at Final Approval`,
  });

  // repetition: identical scene openings
  const openings = new Map<string, number>();
  for (const s of scenes) {
    const opening = String(s.narration ?? "").slice(0, 40).toLowerCase();
    if (opening) openings.set(opening, (openings.get(opening) ?? 0) + 1);
  }
  const repeated = [...openings.values()].some((n) => n > 1);
  checks.push({
    area: "repetition", key: "repeated_openings",
    status: scenes.length === 0 ? "na" : repeated ? "warn" : "pass",
    naReason: scenes.length === 0 ? "No scenes" : undefined,
    message: repeated ? "Some scenes share identical openings" : "No repeated scene openings",
  });

  // duration fit
  if (input.targetDurationSec) {
    const delta = Math.abs(input.estimatedDurationSec - input.targetDurationSec);
    const fit = delta <= input.targetDurationSec * 0.1;
    checks.push({
      area: "durationFit", key: "duration_within_tolerance",
      status: fit ? "pass" : "warn",
      message: `Estimated ${input.estimatedDurationSec}s vs target ${input.targetDurationSec}s (delta ${delta}s)`,
    });
  }

  const editorialDepth: Record<string, string> = {
    script: scenes.length === 0 ? "not_reviewed" : incomplete.length === 0 ? "ready_as_text" : "needs_work",
    scenes: incomplete.length === 0 && scenes.length > 0 ? "ready_as_text" : "needs_work",
  };
  void CORE_NON_WAIVABLE;
  return { checks, editorialDepth };
}

export function scoreAudit(input: {
  checks: AuditCheck[];
  modelAreas?: Record<string, number>;
  brandProject: boolean;
  weightsOverride?: Record<string, number>;
  threshold?: number;
}): {
  areas: Record<string, AreaResult>;
  totalScore: number;
  threshold: number;
  passed: boolean;
  incomplete: boolean;
  blockedByCritical: string[];
  mandatoryFailures: AuditCheck[];
  weightsUsed: Record<string, number>;
} {
  const weights =
    input.weightsOverride ??
    (input.brandProject ? PLATFORM_DEFAULTS.auditWeightsBrand : PLATFORM_DEFAULTS.auditWeightsStandard);
  const threshold = input.threshold ?? PLATFORM_DEFAULTS.auditPassThreshold;
  const areas: Record<string, AreaResult> = {};
  const byArea = new Map<string, AuditCheck[]>();
  for (const c of input.checks) {
    byArea.set(c.area, [...(byArea.get(c.area) ?? []), c]);
  }
  let incomplete = false;
  for (const [area, weight] of Object.entries(weights)) {
    const areaChecks = byArea.get(area) ?? [];
    const modelScore = input.modelAreas?.[area];
    let score: number | null;
    if (modelScore !== undefined) {
      score = modelScore;
    } else if (areaChecks.length === 0) {
      score = null;
    } else {
      const applicable = areaChecks.filter((c) => c.status !== "na");
      if (applicable.length === 0) score = null;
      else {
        const points = applicable.reduce(
          (sum, c) => sum + (c.status === "pass" ? 10 : c.status === "warn" ? 5 : 0),
          0,
        );
        score = Math.round((points / applicable.length) * 10) / 10;
      }
    }
    if (score === null && areaChecks.every((c) => c.status === "na") && areaChecks.length > 0) {
      // fully N/A area: excluded from the total (redistribution below)
    } else if (score === null) {
      incomplete = true; // required area unassessable
    }
    areas[area] = { score, weight, checks: areaChecks };
  }
  // weighted total over assessable areas, weights redistributed
  let weighted = 0;
  let weightSum = 0;
  for (const area of Object.values(areas)) {
    if (area.score !== null) {
      weighted += (area.score / 10) * area.weight;
      weightSum += area.weight;
    }
  }
  const totalScore = weightSum > 0 ? Math.round((weighted / weightSum) * 1000) / 10 : 0;
  const mandatoryFailures = input.checks.filter((c) => c.status === "fail");
  const blockedByCritical = input.checks
    .filter((c) => c.critical && c.status === "fail")
    .map((c) => c.key);
  const passed = !incomplete && blockedByCritical.length === 0 && totalScore >= threshold;
  return {
    areas, totalScore, threshold, passed, incomplete,
    blockedByCritical, mandatoryFailures, weightsUsed: weights,
  };
}

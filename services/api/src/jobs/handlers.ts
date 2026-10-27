/**
 * Job handlers for all 15 JobActions (§6/§7). Generation calls the
 * assigned model via the AI client; without a configured provider
 * key the job fails with PROVIDER_NOT_CONFIGURED and the stage is
 * marked failed — nothing is ever faked.
 */
import type { RunStage } from "@scriptwriter/shared";
import { chatJson, embed, ProviderNotConfigured } from "../ai/client.js";
import { stageMessages } from "../ai/prompts.js";
import { getFormatProfiles, getTaxonomy } from "../ai/library.js";
import type { JobContext } from "./engine.js";
import { registerHandler } from "./engine.js";
import { setStage } from "../runs/stages.js";
import {
  bibleArtifact,
  current,
  currentOutline,
  currentScript,
  listScenes,
  projectConfigAnswers,
  researchArtifacts,
  runBible,
  saveVersioned,
} from "../runs/data.js";
import { runDeterministicChecks, scoreAudit } from "../runs/audit.js";
import { buildPackage } from "../runs/package.js";
import { PLATFORM_DEFAULTS } from "../platform/settings.js";
import type { RunRecord } from "../platform/store.js";

type Obj = Record<string, unknown>;
const now = () => new Date().toISOString();

async function failStage(ctx: JobContext, stage: RunStage, err: Error): Promise<void> {
  if (!ctx.job.runId) return;
  const run = await ctx.deps.platform.getRun(ctx.job.runId);
  if (!run) return;
  const patch = setStage(run, stage, "failed", "system", err.message.slice(0, 200));
  await ctx.deps.platform.updateRun(run.id, {
    ...patch,
    data: { ...run.data, [`${stage}LastError`]: err.message },
  });
}

async function markStage(
  ctx: JobContext,
  run: RunRecord,
  stage: RunStage,
  status: string,
): Promise<RunRecord> {
  const patch = setStage(run, stage, status, "system");
  const updated = await ctx.deps.platform.updateRun(run.id, patch);
  return updated;
}

function generatorSnapshot(result: { providerKey: string; modelId: string; fallbackUsed?: string }) {
  return {
    providerKey: result.providerKey,
    modelId: result.modelId,
    fallbackUsed: result.fallbackUsed ?? null,
    recordedAt: now(),
  };
}

/* ---------------- bible_generate ---------------- */
registerHandler("bible_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const project = await platform.getProject(ctx.job.projectId!);
  if (!project) throw new Error("Project not found");
  const strategy = await current(platform, "audience_strategy", { projectId: project.id });
  const niches = await platform.listArtifacts({ kind: "project_niche", projectId: project.id, currentOnly: true });
  const answers = await projectConfigAnswers(platform, project.id);
  try {
    const { data, result } = await chatJson<Obj>(
      platform,
      "bible_generate",
      await stageMessages(platform, "bible_generate", {
        project: { name: project.name, type: project.type, platform: project.platform },
        niches: niches.map((n) => n.data),
        audienceStrategy: strategy?.data ?? null,
        configAnswers: answers,
      }),
    );
    const saved = await saveVersioned(platform, {
      kind: "bible_version",
      ownerId: project.ownerId,
      projectId: project.id,
      status: "draft",
      data: { ...data, generatedBy: generatorSnapshot(result) },
    });
    await ctx.checkpoint(1, 1);
    return {
      result: { bibleVersion: saved.versionNo },
      resultRefs: [{ type: "bible_version", id: saved.id, version: saved.versionNo }],
      actualCredits: ctx.job.estimatedCredits,
    };
  } catch (err) {
    throw err;
  }
});

/* ---------------- topic_generate ---------------- */
registerHandler("topic_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  let currentRun = await markStage(ctx, run, "topics", "in_progress");
  const dnr = await platform.listArtifacts({
    kind: "master_list_entry", projectId: run.projectId, key: "doNotRepeat", currentOnly: true,
  });
  const count = Number(ctx.job.params.count ?? 10);
  try {
    const { data, result } = await chatJson<{ topics: Obj[] }>(
      platform,
      "topic_generate",
      await stageMessages(platform, "topic_generate", {
        nicheId: ctx.job.params.nicheId,
        subNicheId: ctx.job.params.subNicheId,
        count,
        mix: ctx.job.params.mix ?? "mixed",
        angle: run.snapshots.angle ?? null,
        doNotRepeat: dnr.map((d) => d.data),
      }),
    );
    const refs: unknown[] = [];
    for (const [i, topic] of (data.topics ?? []).entries()) {
      const saved = await platform.createArtifact({
        kind: "topic",
        ownerId: run.ownerId,
        projectId: run.projectId,
        runId: run.id,
        versionNo: 1,
        isCurrent: true,
        status: "candidate",
        data: { ...topic, source: "generated" },
      });
      refs.push({ type: "topic", id: saved.id });
      await ctx.checkpoint(i + 1, count);
    }
    currentRun = await ctx.deps.platform.getRun(run.id) ?? currentRun;
    await ctx.deps.platform.updateRun(run.id, {
      snapshots: { ...currentRun.snapshots, generatorProfile: generatorSnapshot(result) },
    });
    return { result: { topicsCreated: refs.length }, resultRefs: refs };
  } catch (err) {
    await failStage(ctx, "topics", err as Error);
    throw err;
  }
});

/* ---------------- topic_evaluate ---------------- */
registerHandler("topic_evaluate", async (ctx) => {
  const platform = ctx.deps.platform;
  const topic = await platform.getArtifact(String(ctx.job.params.topicId));
  if (!topic) throw new Error("Topic not found");
  try {
    const { data } = await chatJson<{ scores: Record<string, number> }>(
      platform,
      "topic_evaluate",
      await stageMessages(platform, "topic_evaluate", { topic: topic.data }),
    );
    const scores = data.scores ?? {};
    const values = Object.values(scores).filter((v) => typeof v === "number");
    const total = values.length
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : 0;
    await platform.updateArtifact(topic.id, {
      data: { ...topic.data, aiScores: scores, totalScore: total },
    });
    await ctx.checkpoint(1, 1);
    return { result: { scores, total } };
  } catch (err) {
    throw err;
  }
});

/* ---------------- research_run ---------------- */
registerHandler("research_run", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  await markStage(ctx, run, "research", "in_progress");
  const mode = String(ctx.job.params.mode ?? run.data.researchMode ?? "curated_first");
  const project = await platform.getProject(run.projectId);
  // Candidate sources: project Master Source List + user/run sources.
  const masterSources = await platform.listArtifacts({
    kind: "master_list_entry", projectId: run.projectId, key: "sourceList", currentOnly: true,
  });
  const attached = await platform.listArtifacts({
    kind: "project_source", projectId: run.projectId, currentOnly: true,
  });
  const candidates: Obj[] = [
    ...masterSources.map((s) => ({ ...s.data, origin: "library" }) as Obj),
    ...attached.map((s) => ({ ...s.data }) as Obj),
  ].filter((s) => s.reviewStatus !== "blocked" && s.credibilityTier !== 5);

  // Fetch content for URL candidates (leads are not evidence — the
  // platform fetches and only fetched passages can support claims).
  const fetched: Obj[] = [];
  for (const source of candidates.slice(0, 12)) {
    const url = String(source.url ?? "");
    if (!/^https?:\/\//.test(url)) continue;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (res.ok) {
        const text = (await res.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 6000);
        fetched.push({ sourceId: source.libraryEntryId ?? source.name ?? url, title: source.name ?? source.title, text });
      }
    } catch {
      /* unreachable source: stays a lead, never evidence */
    }
  }

  const webApproved = Boolean(ctx.job.params.webFallbackApproved);
  if (fetched.length === 0 && !webApproved) {
    // Insufficient evidence path (A1): record gaps, never search silently.
    const gaps = [
      {
        id: `gap-${Date.now()}`,
        description:
          "No curated source content could be fetched for this run — the brief cannot be evidenced yet",
        affectedScope: "whole topic",
        suggestedQueries: [String(run.snapshots.topicTitle ?? run.title)],
      },
    ];
    await saveVersioned(platform, {
      kind: "research_gaps", ownerId: run.ownerId, projectId: run.projectId, runId: run.id,
      data: { gaps, mode, state: "gap_review", createdAt: now() },
    });
    await platform.createArtifact({
      kind: "niche_gap_log", ownerId: run.ownerId, projectId: run.projectId,
      key: String(run.snapshots.nicheId ?? "unknown"), versionNo: 1, isCurrent: true,
      data: { gaps, runId: run.id, at: now() },
    });
    await ctx.checkpoint(1, 1);
    return { result: { state: "gap_review", gaps, mode } };
  }

  try {
    const { data, result } = await chatJson<Obj>(
      platform,
      "research_run",
      await stageMessages(platform, "research_run", {
        topic: run.snapshots.topicTitle ?? run.title,
        storyQuestion: run.snapshots.storyQuestion ?? null,
        angle: run.snapshots.angle ?? null,
        mode,
        fetchedPassages: fetched,
        webFallbackApproved: webApproved,
      }),
    );
    const brief = await saveVersioned(platform, {
      kind: "research_brief",
      ownerId: run.ownerId,
      projectId: run.projectId,
      runId: run.id,
      status: "draft",
      data: { ...data, mode, generatedBy: generatorSnapshot(result) },
    });
    for (const claim of (data.claims as Obj[] | undefined) ?? []) {
      await platform.createArtifact({
        kind: "research_claim",
        ownerId: run.ownerId,
        projectId: run.projectId,
        runId: run.id,
        versionNo: 1,
        isCurrent: true,
        data: { ...claim, useInScript: claim.useInScript ?? true },
      });
    }
    await ctx.checkpoint(1, 1);
    return {
      result: { state: "brief_ready", briefVersion: brief.versionNo },
      resultRefs: [{ type: "research_brief", id: brief.id }],
    };
  } catch (err) {
    await failStage(ctx, "research", err as Error);
    throw err;
  }
});

/* ---------------- outline_generate ---------------- */
registerHandler("outline_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  await markStage(ctx, run, "outline", "in_progress");
  const brief = await current(platform, "research_brief", { runId: run.id });
  const bible = await runBible(platform, run);
  try {
    const { data, result } = await chatJson<Obj>(
      platform,
      "outline_generate",
      await stageMessages(platform, "outline_generate", {
        brief: brief?.data ?? null,
        bibleStructure: bible?.structureBible ?? null,
        storyQuestion: run.snapshots.storyQuestion ?? null,
      }),
    );
    const saved = await saveVersioned(platform, {
      kind: "outline", ownerId: run.ownerId, projectId: run.projectId, runId: run.id,
      status: "draft",
      data: { ...data, generatedBy: generatorSnapshot(result) },
    });
    await markStage(ctx, (await platform.getRun(run.id))!, "outline", "awaiting_approval");
    await ctx.checkpoint(1, 1);
    return { result: { outlineVersion: saved.versionNo }, resultRefs: [{ type: "outline", id: saved.id }] };
  } catch (err) {
    await failStage(ctx, "outline", err as Error);
    throw err;
  }
});

/* ---------------- script_generate ---------------- */
registerHandler("script_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  await markStage(ctx, run, "script", "in_progress");
  const outline = await currentOutline(platform, run.id);
  const sections = (outline?.data.sections as Obj[] | undefined) ?? [];
  const onlySection = ctx.job.params.sectionKey ? String(ctx.job.params.sectionKey) : undefined;
  const bible = await runBible(platform, run);
  const existing = await currentScript(platform, run.id);
  const existingSections = new Map(
    (((existing?.data.sections as Obj[]) ?? [])).map((s) => [String(s.key), s]),
  );
  try {
    const outSections: Obj[] = [];
    const targets = onlySection ? sections.filter((s) => s.key === onlySection) : sections;
    for (const [i, section] of targets.entries()) {
      const { data } = await chatJson<{ narration: string }>(
        platform,
        "script_generate",
        await stageMessages(platform, "script_generate", {
          section,
          toneBible: bible?.toneBible ?? null,
          language: bible?.languageBible ?? null,
          claims: (await researchArtifacts(platform, run.id)).claims
            .filter((c) => ((section.claimIds as string[]) ?? []).includes(c.id))
            .map((c) => c.data),
        }),
      );
      outSections.push({ ...section, narration: data.narration ?? "" });
      await ctx.checkpoint(i + 1, targets.length || 1);
    }
    const merged = sections.map(
      (s) => outSections.find((o) => o.key === s.key) ?? existingSections.get(String(s.key)) ?? s,
    );
    const wordCount = merged.reduce(
      (sum, s) => sum + String(s.narration ?? "").split(/\s+/).filter(Boolean).length,
      0,
    );
    const wpm = Number(((bible?.toneBible as Obj | undefined)?.wordsPerMinute as number) ?? 150);
    const estimatedDurationSec = Math.round((wordCount / wpm) * 60);
    const saved = await saveVersioned(platform, {
      kind: "script", ownerId: run.ownerId, projectId: run.projectId, runId: run.id,
      status: "draft",
      data: { sections: merged, wordCount, estimatedDurationSec },
    });
    if (!onlySection) {
      await markStage(ctx, (await platform.getRun(run.id))!, "script", "done");
    }
    return {
      result: { scriptVersion: saved.versionNo, wordCount, estimatedDurationSec },
      resultRefs: [{ type: "script", id: saved.id }],
    };
  } catch (err) {
    await failStage(ctx, "script", err as Error);
    throw err;
  }
});

/* ---------------- scene_generate ---------------- */
registerHandler("scene_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  const freshRun = await markStage(ctx, run, "scenes", "in_progress");
  // Single-scene regeneration (§6 scenes/:sceneId/regenerate).
  if (ctx.job.params.sceneId) {
    const sceneArt = await platform.getArtifact(String(ctx.job.params.sceneId));
    if (!sceneArt) throw new Error("Scene not found");
    const bible = await runBible(platform, run);
    const { data } = await chatJson<{ scenes: Obj[] }>(
      platform,
      "scene_generate",
      await stageMessages(platform, "scene_generate", {
        section: { key: sceneArt.data.sectionKey },
        narration: sceneArt.data.narration,
        target: ctx.job.params.target ?? "both",
        visualBible: bible?.visualBible ?? null,
        rangeStart: sceneArt.data.sceneNo,
        rangeSize: 1,
      }),
    );
    const replacement = (data.scenes ?? [])[0];
    if (replacement) {
      await platform.updateArtifact(sceneArt.id, {
        data: { ...sceneArt.data, ...replacement, sceneNo: sceneArt.data.sceneNo },
      });
    }
    await markStage(ctx, (await platform.getRun(run.id))!, "scenes", "done");
    await ctx.checkpoint(1, 1);
    return { result: { regeneratedScene: sceneArt.id } };
  }
  const script = await currentScript(platform, run.id);
  const sections = (script?.data.sections as Obj[] | undefined) ?? [];
  const bible = await runBible(platform, run);
  const setVersion = Number(freshRun.data.sceneSetVersion ?? 0) + 1;
  try {
    // retire the previous set
    for (const old of await listScenes(platform, run.id)) {
      await platform.updateArtifact(old.id, { isCurrent: false });
    }
    let sceneNo = 0;
    const refs: unknown[] = [];
    for (const [i, section] of sections.entries()) {
      const { data } = await chatJson<{ scenes: Obj[] }>(
        platform,
        "scene_generate",
        await stageMessages(platform, "scene_generate", {
          section: { key: section.key, title: section.title },
          narration: section.narration,
          visualBible: bible?.visualBible ?? null,
          rangeStart: sceneNo + 1,
          rangeSize: PLATFORM_DEFAULTS.sceneRangeSize,
        }),
      );
      for (const scene of data.scenes ?? []) {
        sceneNo += 1;
        const narration = String(scene.narration ?? "");
        const voWordCount = narration.split(/\s+/).filter(Boolean).length;
        const estimatedVoSec = Math.round((voWordCount / 150) * 60 * 10) / 10;
        const saved = await platform.createArtifact({
          kind: "scene",
          ownerId: run.ownerId,
          projectId: run.projectId,
          runId: run.id,
          key: `set-${setVersion}`,
          versionNo: setVersion,
          isCurrent: true,
          data: {
            sceneNo,
            sectionKey: section.key,
            chapterId: section.key,
            speakerLabel: scene.speakerLabel ?? "Narrator",
            voWordCount,
            estimatedVoSec,
            durationEstSec: estimatedVoSec,
            sfx: [],
            registryRefs: scene.registryRefs ?? { characterIds: [], locationIds: [], propIds: [] },
            continuityState: scene.continuityState ?? { startState: "", endState: "" },
            referenceInputs: [],
            sourceRefs: [],
            ...scene,
            narration,
          },
        });
        refs.push({ type: "scene", id: saved.id });
      }
      await ctx.checkpoint(i + 1, sections.length || 1);
    }
    const latest = (await platform.getRun(run.id))!;
    await platform.updateRun(run.id, { data: { ...latest.data, sceneSetVersion: setVersion } });
    await markStage(ctx, (await platform.getRun(run.id))!, "scenes", "done");
    return { result: { sceneCount: sceneNo, sceneSetVersion: setVersion }, resultRefs: refs };
  } catch (err) {
    await failStage(ctx, "scenes", err as Error);
    throw err;
  }
});

/* ---------------- audit_run / audit_autofix ---------------- */
async function computeOriginality(ctx: JobContext, run: RunRecord) {
  const platform = ctx.deps.platform;
  const script = await currentScript(platform, run.id);
  const text = ((script?.data.sections as Obj[] | undefined) ?? [])
    .map((s) => String(s.narration ?? ""))
    .join("\n");
  if (!text) return { semanticStatus: "unavailable", score: null as number | null };
  try {
    const dnr = await platform.listArtifacts({
      kind: "master_list_entry", projectId: run.projectId, key: "doNotRepeat", currentOnly: true,
    });
    const priorRuns = (await platform.listRuns(run.projectId)).filter((r) => r.id !== run.id);
    const corpus: string[] = dnr.map((d) => `${String(d.data.title ?? "")} ${String(d.data.angle ?? "")}`);
    for (const prior of priorRuns.slice(0, 5)) {
      const priorScript = await currentScript(platform, prior.id);
      corpus.push(
        ((priorScript?.data.sections as Obj[] | undefined) ?? [])
          .map((s) => String(s.narration ?? ""))
          .join("\n"),
      );
    }
    const usable = corpus.filter((c) => c.trim().length > 0);
    if (usable.length === 0) return { semanticStatus: "complete", score: 0 };
    const { vectors } = await embed(platform, [text.slice(0, 8000), ...usable.map((c) => c.slice(0, 8000))]);
    const { cosine } = await import("../ai/client.js");
    const scores = vectors.slice(1).map((v) => cosine(vectors[0]!, v));
    return { semanticStatus: "complete", score: Math.max(0, ...scores) };
  } catch (err) {
    if (err instanceof ProviderNotConfigured) return { semanticStatus: "unavailable", score: null };
    return { semanticStatus: "keyword_only", score: null };
  }
}

registerHandler("audit_run", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  await markStage(ctx, run, "audit", "in_progress");
  const scenes = (await listScenes(platform, run.id)).map(
    (a) => ({ id: a.id, ...a.data }) as Obj,
  );
  const { claims } = await researchArtifacts(platform, run.id);
  const claimData = claims.map((c) => ({ id: c.id, ...c.data }));
  const script = await currentScript(platform, run.id);
  const project = await platform.getProject(run.projectId);
  const fullOnly = Boolean(ctx.job.params.full);
  void fullOnly;
  const originality = await computeOriginality(ctx, run);
  const det = runDeterministicChecks({
    scenes,
    claims: claimData,
    targetDurationSec: Number(run.data.targetDurationSec ?? 0) || undefined,
    estimatedDurationSec: Number(script?.data.estimatedDurationSec ?? 0),
    brandProject: project?.type === "brand",
    semanticStatus: originality.semanticStatus,
    originalityScore: originality.score,
  });
  // Model-scored areas via the independent audit profile (optional).
  let modelAreas: Record<string, number> | undefined;
  let auditorProfile = "deterministic";
  try {
    const { data, result } = await chatJson<{ areas: Record<string, number> }>(
      platform,
      "audit_run",
      await stageMessages(platform, "audit_run", {
        scenes: scenes.map((s) => ({ sceneNo: s.sceneNo, narration: s.narration })),
        claims: claimData,
      }),
    );
    modelAreas = data.areas;
    auditorProfile = `${result.providerKey}/${result.modelId}`;
  } catch (err) {
    if (!(err instanceof ProviderNotConfigured)) throw err;
  }
  const weights = (await platform.getSetting<Record<string, number>>(
    project?.type === "brand" ? "auditWeightsBrand" : "auditWeightsStandard",
  )) ?? undefined;
  const scored = scoreAudit({
    checks: det.checks,
    modelAreas,
    brandProject: project?.type === "brand",
    weightsOverride: weights,
    threshold: await platform.getSetting<number>("auditPassThreshold"),
  });
  const saved = await saveVersioned(platform, {
    kind: "audit_report",
    ownerId: run.ownerId,
    projectId: run.projectId,
    runId: run.id,
    status: scored.passed ? "passed" : "failed",
    data: {
      areas: scored.areas,
      totalScore: scored.totalScore,
      threshold: scored.threshold,
      passed: scored.passed,
      incomplete: scored.incomplete,
      blockedByCritical: scored.blockedByCritical,
      mandatoryFailures: scored.mandatoryFailures,
      weightsUsed: scored.weightsUsed,
      weightsVersion: "v1",
      editorialDepth: det.editorialDepth,
      semanticStatus: originality.semanticStatus,
      auditorProfile,
      createdAt: now(),
    },
  });
  await markStage(ctx, (await platform.getRun(run.id))!, "audit", "done");
  await ctx.checkpoint(1, 1);
  return {
    result: { auditVersion: saved.versionNo, totalScore: scored.totalScore, passed: scored.passed },
    resultRefs: [{ type: "audit_report", id: saved.id }],
  };
});

registerHandler("audit_autofix", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  const report = await current(platform, "audit_report", { runId: run.id });
  const checkKey = String(ctx.job.params.checkKey ?? "");
  const failure = ((report?.data.mandatoryFailures as Obj[] | undefined) ?? []).find(
    (f) => f.key === checkKey,
  );
  if (!failure) throw new Error(`No failing check ${checkKey} in the latest audit`);
  const sceneNos = (failure.sceneNos as number[] | undefined) ?? [];
  const scenes = (await listScenes(platform, run.id)).filter((a) =>
    sceneNos.includes(Number(a.data.sceneNo)),
  );
  try {
    const { data } = await chatJson<{ scenes: Obj[] }>(
      platform,
      "audit_autofix",
      await stageMessages(platform, "audit_autofix", {
        failure,
        scenes: scenes.map((s) => s.data),
      }),
    );
    const fixed = new Map((data.scenes ?? []).map((s) => [Number(s.sceneNo), s]));
    for (const scene of scenes) {
      const replacement = fixed.get(Number(scene.data.sceneNo));
      if (replacement) {
        await platform.updateArtifact(scene.id, {
          data: { ...scene.data, ...replacement, autoFixedFrom: checkKey },
        });
      }
    }
    await markStage(ctx, (await platform.getRun(run.id))!, "audit", "needs_revision");
    await ctx.checkpoint(1, 1);
    return { result: { fixedScenes: scenes.length, checkKey } };
  } catch (err) {
    await failStage(ctx, "audit", err as Error);
    throw err;
  }
});

/* ---------------- package_generate ---------------- */
registerHandler("package_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  await markStage(ctx, run, "package", "in_progress");
  const profiles = await getFormatProfiles(platform);
  const requested = String(ctx.job.params.formatProfileId ?? "");
  const profile =
    profiles.find((p) => p.id === requested || p.key === requested) ?? profiles[0] ?? {};
  const deliverables = (ctx.job.params.deliverables as string[] | undefined) ?? [
    "finalScript", "sceneBreakdown", "voInstructions",
  ];
  const previous = await platform.listArtifacts({ kind: "package", runId: run.id });
  const versionNo = Math.max(0, ...previous.map((p) => p.versionNo)) + 1;
  const { manifest, zipKey } = await buildPackage(ctx.deps, run, {
    deliverables,
    formatProfile: profile,
    versionNo,
  });
  for (const old of previous) await platform.updateArtifact(old.id, { isCurrent: false });
  const saved = await platform.createArtifact({
    kind: "package",
    ownerId: run.ownerId,
    projectId: run.projectId,
    runId: run.id,
    versionNo,
    isCurrent: true,
    status: "ready",
    data: manifest as Obj,
  });
  // Bible rule: a completed Production Package auto-populates the
  // project's Do-Not-Repeat list.
  if (run.snapshots.topicTitle) {
    await platform.createArtifact({
      kind: "master_list_entry",
      ownerId: run.ownerId,
      projectId: run.projectId,
      key: "doNotRepeat",
      versionNo: 1,
      isCurrent: true,
      data: {
        title: run.snapshots.topicTitle,
        angle: (run.snapshots.angle as Obj | undefined)?.angle ?? "",
        runId: run.id,
        source: "package_completed",
        at: now(),
      },
    });
  }
  const latestRun = (await platform.getRun(run.id))!;
  await platform.updateRun(run.id, { data: { ...latestRun.data, packageOutdated: false } });
  await markStage(ctx, (await platform.getRun(run.id))!, "package", "done");
  await ctx.checkpoint(1, 1);
  return {
    result: { packageVersion: versionNo, zipKey },
    resultRefs: [{ type: "package", id: saved.id }],
  };
});

/* ---------------- export_generate ---------------- */
registerHandler("export_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const projectId = String(ctx.job.params.projectId ?? ctx.job.projectId);
  const project = await platform.getProject(projectId);
  if (!project) throw new Error("Project not found");
  const exportId = String(ctx.job.params.exportId);
  try {
    const all = await platform.listArtifacts({ projectId });
    const projectRuns = await platform.listRuns(projectId);
    const bundle = {
      project,
      artifacts: all.map((a) => ({ kind: a.kind, key: a.key, versionNo: a.versionNo, status: a.status, data: a.data })),
      runs: projectRuns,
      exportedAt: now(),
    };
    const key = `exports/${projectId}/${exportId}.zip`;
    const { buildZip } = await import("./zip.js");
    const zip = await buildZip([{ name: "project.json", content: JSON.stringify(bundle, null, 2) }]);
    await ctx.deps.storage.put(key, zip, "application/zip");
    const exp = await platform.getArtifact(exportId);
    if (exp) {
      await platform.updateArtifact(exportId, {
        status: "ready",
        data: { ...exp.data, storageKey: key, downloadUrl: await ctx.deps.storage.signedUrl(key) },
      });
    }
    await ctx.checkpoint(1, 1);
    return { result: { exportId, storageKey: key } };
  } catch (err) {
    const exp = await platform.getArtifact(exportId);
    if (exp) await platform.updateArtifact(exportId, { status: "failed", data: { ...exp.data, error: (err as Error).message } });
    throw err;
  }
});

/* ---------------- asset_research (16) / publishing_generate (17) ---------------- */
registerHandler("asset_research", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  await markStage(ctx, run, "assets", "in_progress");
  const scenes = (await listScenes(platform, run.id)).map((a) => a.data);
  let assets: Obj[] = [];
  try {
    const { data } = await chatJson<{ assets: Obj[] }>(
      platform,
      "asset_research",
      await stageMessages(platform, "asset_research", { scenes }),
    );
    assets = data.assets ?? [];
  } catch (err) {
    if (!(err instanceof ProviderNotConfigured)) throw err;
    // Deterministic fallback: one asset item per scene footage requirement.
    assets = scenes.map((s) => ({
      sceneNo: s.sceneNo,
      type: "footage",
      description: String(s.footageRequirement ?? s.visualDirection ?? ""),
      sourceNote: "Derived from the scene's footage requirement — verify the source before use",
      licenseStatus: "unverified",
    }));
  }
  for (const old of await platform.listArtifacts({ kind: "asset_item", runId: run.id, currentOnly: true })) {
    await platform.updateArtifact(old.id, { isCurrent: false });
  }
  for (const asset of assets) {
    await platform.createArtifact({
      kind: "asset_item", ownerId: run.ownerId, projectId: run.projectId, runId: run.id,
      versionNo: 1, isCurrent: true, data: asset,
    });
  }
  await markStage(ctx, (await platform.getRun(run.id))!, "assets", "done");
  await ctx.checkpoint(1, 1);
  return { result: { assetCount: assets.length } };
});

registerHandler("publishing_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  await markStage(ctx, run, "publishing", "in_progress");
  const script = await currentScript(platform, run.id);
  try {
    const { data } = await chatJson<Obj>(
      platform,
      "publishing_generate",
      await stageMessages(platform, "publishing_generate", {
        title: run.title,
        topic: run.snapshots.topicTitle ?? null,
        scriptSummary: ((script?.data.sections as Obj[] | undefined) ?? [])
          .map((s) => String(s.narration ?? "").slice(0, 200))
          .join("\n"),
      }),
    );
    await saveVersioned(platform, {
      kind: "publishing", ownerId: run.ownerId, projectId: run.projectId, runId: run.id,
      data,
    });
    const latest = (await platform.getRun(run.id))!;
    if (latest.stageMap.package === "done") {
      await platform.updateRun(run.id, { data: { ...latest.data, packageOutdated: true } });
    }
    await markStage(ctx, (await platform.getRun(run.id))!, "publishing", "done");
    await ctx.checkpoint(1, 1);
    return { result: { generated: true } };
  } catch (err) {
    await failStage(ctx, "publishing", err as Error);
    throw err;
  }
});

/* ---------------- insights_generate ---------------- */
registerHandler("insights_generate", async (ctx) => {
  const platform = ctx.deps.platform;
  const run = await platform.getRun(ctx.job.runId!);
  if (!run) throw new Error("Run not found");
  const records = await platform.listArtifacts({ kind: "performance_record", runId: run.id, currentOnly: true });
  const corrections = await platform.listArtifacts({ kind: "correction", runId: run.id });
  try {
    const { data } = await chatJson<{ insights: Obj[]; proposedBibleEdits: Obj[] }>(
      platform,
      "insights_generate",
      await stageMessages(platform, "insights_generate", {
        performance: records.map((r) => r.data),
        corrections: corrections.map((c) => c.data),
      }),
    );
    await saveVersioned(platform, {
      kind: "performance_insights", ownerId: run.ownerId, projectId: run.projectId, runId: run.id,
      data: { insights: data.insights ?? [], generatedAt: now() },
    });
    for (const edit of data.proposedBibleEdits ?? []) {
      await platform.createArtifact({
        kind: "proposed_bible_edit",
        ownerId: run.ownerId,
        projectId: run.projectId,
        versionNo: 1,
        isCurrent: true,
        status: "pending",
        data: {
          source: "performance_insights",
          sectionKey: edit.sectionKey,
          changeSummary: edit.changeSummary,
          rationale: edit.rationale,
          evidenceRefs: edit.evidenceRefs ?? [],
          runId: run.id,
          createdAt: now(),
        },
      });
    }
    await ctx.checkpoint(1, 1);
    return { result: { insights: (data.insights ?? []).length, proposedEdits: (data.proposedBibleEdits ?? []).length } };
  } catch (err) {
    throw err;
  }
});

/* ---------------- embedding_index ---------------- */
registerHandler("embedding_index", async (ctx) => {
  const platform = ctx.deps.platform;
  const ownerId = ctx.user.id;
  const targets: Array<{ entityType: string; entityId: string; text: string; projectId?: string }> = [];
  for (const topic of await platform.listArtifacts({ kind: "topic", ownerId })) {
    targets.push({
      entityType: "topic", entityId: topic.id,
      text: `${String(topic.data.title ?? "")} ${String(topic.data.angle ?? "")}`,
      projectId: topic.projectId,
    });
  }
  const { vectors, modelId, providerKey } = await embed(
    platform,
    targets.map((t) => t.text.slice(0, 8000)),
  );
  void providerKey;
  for (const [i, target] of targets.entries()) {
    await platform.createArtifact({
      kind: "embedding",
      ownerId,
      projectId: target.projectId,
      key: `${target.entityType}:${target.entityId}`,
      versionNo: 1,
      isCurrent: true,
      data: { entityType: target.entityType, entityId: target.entityId, modelId, vector: vectors[i] ?? [] },
    });
    await ctx.checkpoint(i + 1, targets.length || 1);
  }
  return { result: { indexed: targets.length, modelId } };
});

/* ---------------- taxonomy helper re-export for routes ---------------- */
export { getTaxonomy };

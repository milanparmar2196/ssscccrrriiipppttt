import type { FastifyInstance } from "fastify";
import { isSceneComplete, PACKAGE_DELIVERABLES } from "@scriptwriter/shared";
import { ApiError, successBody } from "../errors.js";
import type { AppDeps } from "../deps.js";
import {
  assertProjectMutable,
  assertRunMutable,
  ownedProject,
  ownedRun,
  publicRun,
  startJob,
  user,
  type JobBody,
} from "../routes/helpers.js";
import { initialStageMap, invalidateForEdit, setStage } from "./stages.js";
import {
  bibleArtifact,
  current,
  currentOutline,
  currentScript,
  listScenes,
  projectConfigAnswers,
  researchArtifacts,
  saveVersioned,
} from "./data.js";
import { getAnglesForTarget } from "../ai/library.js";
import { embed, ProviderNotConfigured } from "../ai/client.js";
import { PLATFORM_DEFAULTS } from "../platform/settings.js";
import type { RunRecord } from "../platform/store.js";

type Obj = Record<string, unknown>;
const now = () => new Date().toISOString();

function tokens(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2));
}
function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

/** Dedupe check (A2): semantic when available, keyword always. */
export async function dedupeCheck(
  deps: AppDeps,
  ownerId: string,
  projectId: string,
  title: string,
  angle: string,
): Promise<{ matches: Obj[]; semanticStatus: string }> {
  const platform = deps.platform;
  const mine = tokens(`${title} ${angle}`);
  const matches: Obj[] = [];
  const topics = await platform.listArtifacts({ kind: "topic", ownerId });
  const dnr = await platform.listArtifacts({ kind: "master_list_entry", projectId, key: "doNotRepeat", currentOnly: true });
  const candidates: Array<{ entityType: string; entityId: string; title: string }> = [
    ...topics.map((t) => ({ entityType: "topic", entityId: t.id, title: `${String(t.data.title ?? "")} ${String(t.data.angle ?? "")}` })),
    ...dnr.map((d) => ({ entityType: "doNotRepeatEntry", entityId: d.id, title: `${String(d.data.title ?? "")} ${String(d.data.angle ?? "")}` })),
  ];
  let semanticStatus = "unavailable";
  let semanticScores = new Map<string, number>();
  try {
    const { vectors } = await embed(platform, [`${title} ${angle}`, ...candidates.map((c) => c.title)]);
    const { cosine } = await import("../ai/client.js");
    semanticStatus = "complete";
    candidates.forEach((c, i) => semanticScores.set(c.entityId, cosine(vectors[0]!, vectors[i + 1]!)));
  } catch (err) {
    semanticStatus = err instanceof ProviderNotConfigured ? "unavailable" : "keyword_only";
  }
  const thresholds = (await platform.getSetting<{ topicDedupe: number }>("similarityThresholds")) ??
    PLATFORM_DEFAULTS.similarityThresholds;
  for (const c of candidates) {
    const keywordScore = jaccard(mine, tokens(c.title));
    const semanticScore = semanticScores.get(c.entityId);
    if (keywordScore >= 0.5 || (semanticScore !== undefined && semanticScore >= thresholds.topicDedupe)) {
      matches.push({
        entityType: c.entityType, entityId: c.entityId, title: c.title,
        keywordScore: Math.round(keywordScore * 100) / 100,
        semanticScore: semanticScore !== undefined ? Math.round(semanticScore * 100) / 100 : undefined,
        context: "within the owner's projects",
      });
    }
  }
  return { matches, semanticStatus };
}

export function registerRunRoutes(app: FastifyInstance, deps: AppDeps): void {
  const platform = deps.platform;

  /* ---------- run creation & lifecycle ---------- */
  app.post<{ Params: { id: string }; Body: Obj }>("/projects/:id/runs", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    // Project-level gates (§4): niche + sub-niche + strategy + approved Bible.
    const niches = await platform.listArtifacts({ kind: "project_niche", projectId: project.id, currentOnly: true });
    const strategy = await current(platform, "audience_strategy", { projectId: project.id });
    const bible = await bibleArtifact(platform, project.id);
    const missing: string[] = [];
    if (niches.length === 0) missing.push("niche");
    if (!strategy) missing.push("audienceStrategy");
    if (!bible) missing.push("approvedBible");
    if (missing.length > 0) {
      throw new ApiError("VALIDATION", "Project is not ready for runs", { missing });
    }
    const body = req.body ?? {};
    const answers = await projectConfigAnswers(platform, project.id);
    const snapshots: Obj = {
      bibleVersion: bible!.versionNo,
      configVersion: 1,
      configAnswers: answers,
    };
    // Angle snapshot (§6A): title-only angles require a story question.
    if (body.angleId) {
      const targetId = String(body.nicheId ?? niches[0]?.data.id ?? "");
      const angles = await getAnglesForTarget(platform, targetId);
      const angle = angles.find((a) => a.id === body.angleId || a.slug === body.angleId);
      if (angle) {
        snapshots.angle = angle;
        snapshots.angleId = angle.id;
        snapshots.angleVersion = angle.version ?? 1;
        if (angle.completeness === "title_only" && !body.storyQuestion) {
          throw new ApiError(
            "VALIDATION",
            "This angle is Title only — a concrete story question is required before research can start",
            { angleCompleteness: "title_only" },
          );
        }
      }
    }
    if (body.storyQuestion) snapshots.storyQuestion = body.storyQuestion;
    const run = await platform.createRun({
      projectId: project.id,
      ownerId: me.id,
      title: typeof body.title === "string" ? body.title : "Untitled run",
      lifecycleStatus: "active",
      stageMap: initialStageMap(),
      stageHistory: [{ stage: "topics", status: "ready", actor: me.id, at: now() }],
      snapshots,
      openIssues: [],
      data: {},
    });
    return successBody(publicRun(run));
  });

  app.get<{ Params: { id: string } }>("/projects/:id/runs", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const runs = await platform.listRuns(project.id);
    return successBody(runs.map(publicRun));
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    return successBody(publicRun(run));
  });

  app.patch<{ Params: { runId: string }; Body: Obj }>("/runs/:runId", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const patch: Partial<RunRecord> = {};
    if (typeof req.body?.title === "string") patch.title = req.body.title;
    if (req.body?.notes !== undefined) patch.data = { ...run.data, notes: req.body.notes };
    return successBody(publicRun(await platform.updateRun(run.id, patch)));
  });

  app.post<{ Params: { runId: string } }>("/runs/:runId/archive", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const { cancelJob } = await import("../jobs/engine.js");
    for (const job of await platform.listJobs({ runId: run.id, status: "queued" })) {
      await cancelJob(deps, job).catch(() => undefined);
    }
    return successBody(publicRun(await platform.updateRun(run.id, { lifecycleStatus: "archived" })));
  });

  app.delete<{ Params: { runId: string }; Body: Obj }>("/runs/:runId", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    if ((req.body ?? {}).confirmTitle !== run.title) {
      throw new ApiError("VALIDATION", "Deletion requires confirmTitle matching the run title");
    }
    const updated = await platform.updateRun(run.id, {
      lifecycleStatus: "pending_deletion",
      deletionRequestedAt: now(),
    });
    return successBody({ ...publicRun(updated), purgeAfterDays: 30 });
  });

  app.post<{ Params: { runId: string } }>("/runs/:runId/restore", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const updated = await platform.updateRun(run.id, {
      lifecycleStatus: "active",
      deletionRequestedAt: null,
    });
    return successBody(publicRun(updated));
  });

  /* ---------- open issues (Rule 11) ---------- */
  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/issues", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const issue = {
      id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: String(req.body?.text ?? ""),
      kind: req.body?.kind ?? "question",
      stage: req.body?.stage ?? "topics",
      status: "open",
      createdAt: now(),
    };
    const updated = await platform.updateRun(run.id, { openIssues: [...run.openIssues, issue] });
    return successBody({ issue, openIssues: updated.openIssues });
  });

  app.patch<{ Params: { runId: string; issueId: string }; Body: Obj }>(
    "/runs/:runId/issues/:issueId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      const openIssues = run.openIssues.map((i) =>
        i.id === req.params.issueId
          ? { ...i, status: req.body?.status ?? i.status, resolution: req.body?.resolution ?? i.resolution }
          : i,
      );
      const updated = await platform.updateRun(run.id, { openIssues });
      return successBody({ openIssues: updated.openIssues });
    },
  );

  /* ---------- brand approval (D1) ---------- */
  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/brand-approval", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const project = await platform.getProject(run.projectId);
    if (project?.type !== "brand") {
      throw new ApiError("VALIDATION", "Brand approval applies to Brand projects only");
    }
    const to = String(req.body?.to ?? "");
    const order = ["Draft", "In Review", "Changes Requested", "Approved", "Final"];
    if (!order.includes(to)) throw new ApiError("VALIDATION", `Invalid approval state: ${to}`);
    if (to === "Changes Requested" && !req.body?.note) {
      throw new ApiError("VALIDATION", "Changes Requested requires a note");
    }
    const history = [...((run.data.brandApprovalHistory as Obj[]) ?? []), {
      to, note: req.body?.note ?? null, actor: me.id, at: now(),
    }];
    const data = {
      ...run.data,
      brandApproval: to,
      brandApprovalHistory: history,
      scriptLocked: to === "Final",
    };
    const updated = await platform.updateRun(run.id, { data });
    return successBody({ brandApproval: to, history, locked: to === "Final", updatedAt: updated.updatedAt });
  });

  /* ---------- config stage ---------- */
  app.get<{ Params: { runId: string } }>("/runs/:runId/config-answers", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    return successBody({ answers: run.snapshots.configAnswers ?? {} });
  });

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/config-answers", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const answers = {
      ...((run.snapshots.configAnswers as Obj) ?? {}),
      ...((req.body?.answers as Obj) ?? {}),
    };
    let snapshots: Obj = { ...run.snapshots, configAnswers: answers };
    let patch: Partial<RunRecord> = { snapshots };
    // Config stage completes when the run carries answers; Bible
    // confirm rule (§4): auto-complete when no newer Bible exists.
    if (run.stageMap.config !== "done") {
      const step1 = setStage({ ...run, ...patch }, "config", "done", me.id);
      patch = { ...patch, ...step1 };
      const bible = await bibleArtifact(platform, run.projectId);
      const hasNewer = bible && bible.versionNo > Number(run.snapshots.bibleVersion ?? 0);
      const withBible = { ...run, ...patch };
      if (!hasNewer) {
        patch = {
          ...patch,
          data: {
            ...run.data,
            bibleConfirm: { mode: "auto_completed", at: now(), snapshotVersion: run.snapshots.bibleVersion },
          },
        };
        void withBible;
      }
    }
    return successBody(publicRun(await platform.updateRun(run.id, patch)));
  });

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/bible/confirm", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const decision = String(req.body?.decision ?? "");
    if (decision !== "acceptVersion" && decision !== "keepSnapshot") {
      throw new ApiError("VALIDATION", "decision must be acceptVersion or keepSnapshot");
    }
    const bible = await bibleArtifact(platform, run.projectId);
    const snapshots = { ...run.snapshots };
    if (decision === "acceptVersion" && bible) snapshots.bibleVersion = bible.versionNo;
    const updated = await platform.updateRun(run.id, {
      snapshots,
      data: {
        ...run.data,
        bibleConfirm: { mode: decision, at: now(), bibleVersion: snapshots.bibleVersion },
      },
    });
    return successBody(publicRun(updated));
  });

  /* ---------- topics (Steps 4-5) ---------- */
  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/topics/generate", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const count = Number(req.body?.count ?? 10);
    const job = await startJob(req, deps, me, {
      action: "topic_generate",
      params: {
        units: count,
        nicheId: req.body?.nicheId, subNicheId: req.body?.subNicheId,
        count, mix: req.body?.mix, stage: "topics",
      },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/topics", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const rows = await platform.listArtifacts({ kind: "topic", runId: run.id });
    const q = req.query as Obj;
    const filtered = rows.filter(
      (r) =>
        (!q.status || r.status === q.status) &&
        (!q.nicheId || r.data.nicheId === q.nicheId) &&
        (!q.subNicheId || r.data.subNicheId === q.subNicheId),
    );
    return successBody(
      filtered
        .map((r) => ({ id: r.id, status: r.status, ...r.data }) as Obj)
        .sort((a, b) => Number(b.totalScore ?? 0) - Number(a.totalScore ?? 0)),
    );
  });

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/topics", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const title = String(req.body?.title ?? "");
    if (!title) throw new ApiError("VALIDATION", "Topic title is required");
    const { matches, semanticStatus } = await dedupeCheck(
      deps, me.id, run.projectId, title, String(req.body?.angle ?? ""),
    );
    if (matches.length > 0 && req.body?.confirmDuplicate !== true) {
      throw new ApiError("POSSIBLE_DUPLICATE", "This topic looks similar to existing work", {
        matches,
        semanticStatus,
      });
    }
    const saved = await platform.createArtifact({
      kind: "topic", ownerId: me.id, projectId: run.projectId, runId: run.id,
      versionNo: 1, isCurrent: true, status: "candidate",
      data: {
        ...(req.body ?? {}),
        source: "manual",
        ...(matches.length > 0
          ? { duplicateAcknowledgement: { by: me.id, at: now(), matchesShown: matches.map((m) => m.entityId) } }
          : {}),
      },
    });
    return successBody({ id: saved.id, status: saved.status, ...saved.data, semanticStatus });
  });

  app.patch<{ Params: { runId: string; topicId: string }; Body: Obj }>(
    "/runs/:runId/topics/:topicId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const topic = await platform.getArtifact(req.params.topicId);
      if (!topic || topic.runId !== run.id) throw new ApiError("NOT_FOUND", "Topic not found");
      const updated = await platform.updateArtifact(topic.id, { data: { ...topic.data, ...(req.body ?? {}) } });
      return successBody({ id: updated.id, ...updated.data });
    },
  );

  app.delete<{ Params: { runId: string; topicId: string } }>(
    "/runs/:runId/topics/:topicId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const topic = await platform.getArtifact(req.params.topicId);
      if (!topic || topic.runId !== run.id) throw new ApiError("NOT_FOUND", "Topic not found");
      await platform.updateArtifact(topic.id, { isCurrent: false, status: "archived" });
      return successBody({ archived: true });
    },
  );

  app.post<{ Params: { runId: string; topicId: string }; Body: JobBody }>(
    "/runs/:runId/topics/:topicId/evaluate",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const job = await startJob(req, deps, me, {
        action: "topic_evaluate",
        params: { units: 1, topicId: req.params.topicId },
        projectId: run.projectId, runId: run.id, body: req.body ?? {},
      });
      return successBody({ jobId: job.id, status: job.status });
    },
  );

  app.patch<{ Params: { runId: string; topicId: string }; Body: Obj }>(
    "/runs/:runId/topics/:topicId/scores",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const topic = await platform.getArtifact(req.params.topicId);
      if (!topic || topic.runId !== run.id) throw new ApiError("NOT_FOUND", "Topic not found");
      const updated = await platform.updateArtifact(topic.id, {
        data: { ...topic.data, userScores: req.body?.scores ?? {} },
      });
      return successBody({ id: updated.id, ...updated.data });
    },
  );

  app.post<{ Params: { runId: string; topicId: string } }>(
    "/runs/:runId/topics/:topicId/select",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const topic = await platform.getArtifact(req.params.topicId);
      if (!topic || topic.runId !== run.id) throw new ApiError("NOT_FOUND", "Topic not found");
      await platform.updateArtifact(topic.id, { status: "selected" });
      const patch = setStage(run, "topics", "done", me.id);
      const updated = await platform.updateRun(run.id, {
        ...patch,
        selectedTopicId: topic.id,
        snapshots: {
          ...run.snapshots,
          topicTitle: topic.data.title,
          topicId: topic.id,
          nicheId: topic.data.nicheId ?? run.snapshots.nicheId,
        },
      });
      return successBody(publicRun(updated));
    },
  );
}

export function registerRunStepRoutes(app: FastifyInstance, deps: AppDeps): void {
  const platform = deps.platform;

  /* ---------- research (Step 7) ---------- */
  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/research/run", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const angle = run.snapshots.angle as Obj | undefined;
    if (angle?.completeness === "title_only" && !run.snapshots.storyQuestion) {
      throw new ApiError(
        "VALIDATION",
        "Title-only angle: a story question must be set on the run before research can start",
      );
    }
    const job = await startJob(req, deps, me, {
      action: "research_run",
      params: { units: 1, mode: req.body?.mode, stage: "research" },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/research", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const { brief, sources, claims } = await researchArtifacts(platform, run.id);
    if (!brief) return successBody(null);
    const angle = run.snapshots.angle as Obj | undefined;
    return successBody({
      version: brief.versionNo,
      status: brief.status,
      header:
        angle?.completeness === "title_only"
          ? "title-only angle — question only, no scope boundary"
          : undefined,
      ...brief.data,
      sources: sources.map((s) => ({ id: s.id, ...s.data })),
      claims: claims.map((c) => ({ id: c.id, ...c.data })),
    });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/research/gaps", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const gaps = await current(platform, "research_gaps", { runId: run.id });
    return successBody(gaps?.data ?? { gaps: [] });
  });

  app.post<{ Params: { runId: string }; Body: JobBody }>(
    "/runs/:runId/research/approve-web-fallback",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const mode = String(run.data.researchMode ?? "curated_first");
      if (mode === "curated_only" || mode === "selected_only") {
        throw new ApiError("VALIDATION", "Web fallback is not available in this research mode — change the mode first");
      }
      const flags = (await platform.getSetting<{ webResearchFallback: boolean }>("featureFlags")) ??
        PLATFORM_DEFAULTS.featureFlags;
      if (!flags.webResearchFallback) throw new ApiError("FEATURE_DISABLED", "Web research fallback module is disabled");
      const job = await startJob(req, deps, me, {
        action: "research_run",
        params: { units: 1, mode, webFallbackApproved: true, gapIds: req.body?.gapIds, stage: "research" },
        projectId: run.projectId, runId: run.id, body: req.body ?? {},
      });
      return successBody({ jobId: job.id, status: job.status });
    },
  );

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/research/narrow-scope", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const updated = await platform.updateRun(run.id, {
      data: { ...run.data, acceptedScope: req.body?.acceptedScope, scopeNarrowedAt: now() },
    });
    return successBody({ acceptedScope: updated.data.acceptedScope });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/research/discovered-sources", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const rows = await platform.listArtifacts({ kind: "research_source", runId: run.id });
    return successBody(
      rows.filter((r) => r.data.origin === "web_discovered").map((r) => ({ id: r.id, ...r.data })),
    );
  });

  app.post<{ Params: { runId: string; sourceId: string }; Body: Obj }>(
    "/runs/:runId/research/sources/:sourceId/review",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const source = await platform.getArtifact(req.params.sourceId);
      if (!source || source.runId !== run.id) throw new ApiError("NOT_FOUND", "Source not found");
      const action = String(req.body?.action ?? "");
      if (action === "approve_project") {
        await platform.createArtifact({
          kind: "master_list_entry", ownerId: me.id, projectId: run.projectId, key: "sourceList",
          versionNo: 1, isCurrent: true,
          data: { ...source.data, reviewStatus: "approved", scope: "project" },
        });
      }
      if (action === "promote_global") {
        await platform.putLibraryRecord({
          kind: "source_library", recordKey: `web-${source.id}`,
          payload: { ...source.data, reviewStatus: "pending", needs_tier_review: source.data.credibilityTier == null },
          version: 1, status: "active", updatedBy: me.id,
        });
      }
      const reviewState =
        action === "block" ? "blocked" : action === "leave_unapproved" ? "unapproved" : action;
      const updated = await platform.updateArtifact(source.id, {
        data: { ...source.data, reviewState, reviewNote: req.body?.note },
      });
      return successBody({ id: updated.id, ...updated.data });
    },
  );

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/research/sources", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const saved = await platform.createArtifact({
      kind: "research_source", ownerId: me.id, projectId: run.projectId, runId: run.id,
      versionNo: 1, isCurrent: true,
      data: { accessedAt: now(), origin: "user_supplied", reviewStatus: "pending", ...(req.body ?? {}) },
    });
    return successBody({ id: saved.id, ...saved.data });
  });

  app.patch<{ Params: { runId: string; sourceId: string }; Body: Obj }>(
    "/runs/:runId/research/sources/:sourceId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const source = await platform.getArtifact(req.params.sourceId);
      if (!source || source.runId !== run.id) throw new ApiError("NOT_FOUND", "Source not found");
      const updated = await platform.updateArtifact(source.id, { data: { ...source.data, ...(req.body ?? {}) } });
      return successBody({ id: updated.id, ...updated.data });
    },
  );

  app.delete<{ Params: { runId: string; sourceId: string } }>(
    "/runs/:runId/research/sources/:sourceId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const source = await platform.getArtifact(req.params.sourceId);
      if (!source || source.runId !== run.id) throw new ApiError("NOT_FOUND", "Source not found");
      await platform.deleteArtifact(source.id);
      return successBody({ deleted: true });
    },
  );

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/research/claims", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const body = req.body ?? {};
    if (body.status === "verified_fact") {
      const sourceIds = (body.sourceIds as string[]) ?? [];
      const sources = await platform.listArtifacts({ kind: "research_source", runId: run.id });
      const byId = new Map(sources.map((s) => [s.id, s.data]));
      const tier1 = sourceIds.filter((id) => Number(byId.get(id)?.credibilityTier) === 1).length;
      const credible = sourceIds.filter((id) => {
        const t = Number(byId.get(id)?.credibilityTier);
        return t >= 1 && t <= 3;
      }).length;
      if (!(tier1 >= 1 || credible >= 2)) {
        throw new ApiError(
          "VALIDATION",
          "A verified_fact claim needs one tier-1 (primary) source or two independent credible sources (§13 standard)",
        );
      }
    }
    const saved = await platform.createArtifact({
      kind: "research_claim", ownerId: me.id, projectId: run.projectId, runId: run.id,
      versionNo: 1, isCurrent: true, data: { useInScript: true, ...body },
    });
    return successBody({ id: saved.id, ...saved.data });
  });

  app.patch<{ Params: { runId: string; claimId: string }; Body: Obj }>(
    "/runs/:runId/research/claims/:claimId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const claim = await platform.getArtifact(req.params.claimId);
      if (!claim || claim.runId !== run.id) throw new ApiError("NOT_FOUND", "Claim not found");
      const updated = await platform.updateArtifact(claim.id, { data: { ...claim.data, ...(req.body ?? {}) } });
      return successBody({ id: updated.id, ...updated.data });
    },
  );

  app.post<{ Params: { runId: string } }>("/runs/:runId/research/approve", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const { claims } = await researchArtifacts(platform, run.id);
    const badVerified = claims.filter(
      (c) => c.data.useInScript && c.data.status === "verified_fact" && ((c.data.sourceIds as string[]) ?? []).length === 0,
    );
    if (badVerified.length > 0) {
      throw new ApiError("VALIDATION", "Claims marked verified_fact have no sources", {
        claimIds: badVerified.map((c) => c.id),
      });
    }
    const unresolvedConflicts = claims.filter(
      (c) => c.data.status === "conflicting" && !c.data.conflictResolution,
    );
    const issueTexts = new Set(run.openIssues.map((i) => String(i.text)));
    const unaccounted = unresolvedConflicts.filter((c) => !issueTexts.has(String(c.data.text)));
    if (unaccounted.length > 0) {
      throw new ApiError(
        "VALIDATION",
        "Unresolved conflicting claims must be resolved or copied to open issues before approval",
        { claimIds: unaccounted.map((c) => c.id) },
      );
    }
    const brief = await current(platform, "research_brief", { runId: run.id });
    if (brief) await platform.updateArtifact(brief.id, { status: "approved" });
    // Verified timeline events are proposed as Master Timeline entries.
    for (const event of ((brief?.data.timeline as Obj[]) ?? [])) {
      await platform.createArtifact({
        kind: "master_list_entry", ownerId: me.id, projectId: run.projectId, key: "masterTimeline",
        versionNo: 1, isCurrent: true,
        data: { ...event, proposedFromRun: run.id, status: "proposed" },
      });
    }
    const patch = setStage(run, "research", "done", me.id);
    return successBody(publicRun(await platform.updateRun(run.id, patch)));
  });

  /* ---------- outline (Step 9) ---------- */
  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/outline/generate", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const job = await startJob(req, deps, me, {
      action: "outline_generate",
      params: { units: 1, stage: "outline" },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/outline", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const outline = await currentOutline(platform, run.id);
    if (!outline) return successBody(null);
    return successBody({ version: outline.versionNo, status: outline.status, ...outline.data });
  });

  app.patch<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/outline", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const outline = await currentOutline(platform, run.id);
    if (!outline) throw new ApiError("NOT_FOUND", "No outline yet");
    if (outline.status === "approved") {
      throw new ApiError("CONFLICT", "Approved outline versions are immutable — edits create a new draft via regeneration");
    }
    const saved = await saveVersioned(platform, {
      kind: "outline", ownerId: me.id, projectId: run.projectId, runId: run.id,
      status: "draft", data: { ...outline.data, ...(req.body ?? {}) },
    });
    const patch = invalidateForEdit(run, "outline", me.id);
    await platform.updateRun(run.id, patch);
    return successBody({ version: saved.versionNo, ...saved.data });
  });

  app.post<{ Params: { runId: string } }>("/runs/:runId/outline/approve", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const outline = await currentOutline(platform, run.id);
    if (!outline) throw new ApiError("NOT_FOUND", "No outline yet");
    await platform.updateArtifact(outline.id, { status: "approved" });
    const patch = setStage(run, "outline", "done", me.id);
    return successBody(publicRun(await platform.updateRun(run.id, patch)));
  });

  /* ---------- script (Step 10) ---------- */
  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/script/generate", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const outline = await currentOutline(platform, run.id);
    const units = ((outline?.data.sections as Obj[]) ?? []).length || 1;
    const job = await startJob(req, deps, me, {
      action: "script_generate",
      params: { units, stage: "script" },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.post<{ Params: { runId: string; sectionKey: string }; Body: JobBody }>(
    "/runs/:runId/script/sections/:sectionKey/regenerate",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const job = await startJob(req, deps, me, {
        action: "script_generate",
        params: { units: 1, sectionKey: req.params.sectionKey, stage: "script" },
        projectId: run.projectId, runId: run.id, body: req.body ?? {},
      });
      return successBody({ jobId: job.id, status: job.status });
    },
  );

  app.get<{ Params: { runId: string } }>("/runs/:runId/script", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const script = await currentScript(platform, run.id);
    if (!script) return successBody(null);
    const target = Number(run.data.targetDurationSec ?? 0);
    return successBody({
      version: script.versionNo,
      status: script.status,
      ...script.data,
      durationDeltaSec: target
        ? Number(script.data.estimatedDurationSec ?? 0) - target
        : undefined,
    });
  });

  app.patch<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/script", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    if (run.data.scriptLocked) {
      throw new ApiError("CONFLICT", "Script is locked by Brand Final approval — edits restart at Draft on a new version");
    }
    const script = await currentScript(platform, run.id);
    if (!script) throw new ApiError("NOT_FOUND", "No script yet");
    const sections = (req.body?.sections as Obj[]) ?? script.data.sections;
    const wordCount = (sections as Obj[]).reduce(
      (sum, s) => sum + String(s.narration ?? "").split(/\s+/).filter(Boolean).length, 0,
    );
    const saved = await saveVersioned(platform, {
      kind: "script", ownerId: me.id, projectId: run.projectId, runId: run.id,
      status: "draft",
      data: { ...script.data, sections, wordCount, estimatedDurationSec: Math.round((wordCount / 150) * 60) },
    });
    await platform.updateRun(run.id, invalidateForEdit(run, "script", me.id));
    return successBody({ version: saved.versionNo, ...saved.data });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/script/versions", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const rows = await platform.listArtifacts({ kind: "script", runId: run.id });
    return successBody(rows.map((r) => ({ version: r.versionNo, status: r.status, updatedAt: r.updatedAt })));
  });

  /* ---------- scenes (Step 11) ---------- */
  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/scenes/generate", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const script = await currentScript(platform, run.id);
    const units = ((script?.data.sections as Obj[]) ?? []).length || 1;
    const job = await startJob(req, deps, me, {
      action: "scene_generate",
      params: { units, stage: "scenes" },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/scenes", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const scenes = await listScenes(platform, run.id);
    const totals = {
      sceneCount: scenes.length,
      totalWords: scenes.reduce((s, a) => s + Number(a.data.voWordCount ?? 0), 0),
      estimatedDurationSec: scenes.reduce((s, a) => s + Number(a.data.durationEstSec ?? 0), 0),
      scenesMissingVisual: scenes.filter((a) => !a.data.visualDirection).length,
    };
    return successBody({
      scenes: scenes.map((a) => ({ id: a.id, complete: isSceneComplete(a.data as never).complete, gaps: isSceneComplete(a.data as never).gaps, ...a.data })),
      totals,
      gaps: scenes
        .filter((a) => !isSceneComplete(a.data as never).complete)
        .map((a) => ({ sceneNo: a.data.sceneNo, complete: false, gaps: isSceneComplete(a.data as never).gaps })),
    });
  });

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/scenes", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const saved = await platform.createArtifact({
      kind: "scene", ownerId: me.id, projectId: run.projectId, runId: run.id,
      key: `set-${Number(run.data.sceneSetVersion ?? 1)}`,
      versionNo: Number(run.data.sceneSetVersion ?? 1), isCurrent: true,
      data: req.body ?? {},
    });
    await platform.updateRun(run.id, invalidateForEdit(run, "scenes", me.id));
    return successBody({ id: saved.id, complete: isSceneComplete(saved.data as never).complete, ...saved.data });
  });

  app.patch<{ Params: { runId: string; sceneId: string }; Body: Obj }>(
    "/runs/:runId/scenes/:sceneId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const scene = await platform.getArtifact(req.params.sceneId);
      if (!scene || scene.runId !== run.id) throw new ApiError("NOT_FOUND", "Scene not found");
      const data = { ...scene.data, ...(req.body ?? {}) };
      if (typeof data.narration === "string") {
        data.voWordCount = data.narration.split(/\s+/).filter(Boolean).length;
        data.estimatedVoSec = Math.round((Number(data.voWordCount) / 150) * 60 * 10) / 10;
      }
      const updated = await platform.updateArtifact(scene.id, { data });
      await platform.updateRun(run.id, invalidateForEdit(run, "scenes", me.id));
      return successBody({ id: updated.id, complete: isSceneComplete(updated.data as never).complete, ...updated.data });
    },
  );

  app.delete<{ Params: { runId: string; sceneId: string } }>(
    "/runs/:runId/scenes/:sceneId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const scene = await platform.getArtifact(req.params.sceneId);
      if (!scene || scene.runId !== run.id) throw new ApiError("NOT_FOUND", "Scene not found");
      await platform.updateArtifact(scene.id, { isCurrent: false, status: "deleted" });
      return successBody({ deleted: true });
    },
  );

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/scenes/reorder", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const order = (req.body?.sceneIds as string[]) ?? [];
    for (const [i, id] of order.entries()) {
      const scene = await platform.getArtifact(id);
      if (scene && scene.runId === run.id) {
        await platform.updateArtifact(id, { data: { ...scene.data, sceneNo: i + 1 } });
      }
    }
    return successBody({ reordered: order.length });
  });

  app.post<{ Params: { runId: string; sceneId: string }; Body: JobBody }>(
    "/runs/:runId/scenes/:sceneId/regenerate",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const job = await startJob(req, deps, me, {
        action: "scene_generate",
        params: { units: 1, sceneId: req.params.sceneId, target: req.body?.target ?? "both", stage: "scenes" },
        projectId: run.projectId, runId: run.id, body: req.body ?? {},
      });
      return successBody({ jobId: job.id, status: job.status });
    },
  );
}

export function registerRunFinalRoutes(app: FastifyInstance, deps: AppDeps): void {
  const platform = deps.platform;

  /* ---------- audit (Step 12) ---------- */
  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/audit/run", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const job = await startJob(req, deps, me, {
      action: "audit_run",
      params: { units: 1, stage: "audit", full: true },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/audit/re-run", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const scenes = await listScenes(platform, run.id);
    const changed = scenes.filter((s) => s.data.autoFixedFrom || s.updatedAt > (run.data.lastAuditAt as string ?? "")).length;
    const ratio = scenes.length ? changed / scenes.length : 1;
    const threshold = (await platform.getSetting<number>("auditRerunFullThreshold")) ??
      PLATFORM_DEFAULTS.auditRerunFullThreshold;
    const job = await startJob(req, deps, me, {
      action: "audit_run",
      params: { units: 1, stage: "audit", full: ratio > threshold, changedRatio: ratio },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status, full: ratio > threshold });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/audit", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const report = await current(platform, "audit_report", { runId: run.id });
    if (!report) return successBody(null);
    return successBody({ version: report.versionNo, ...report.data });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/audit/versions", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const rows = await platform.listArtifacts({ kind: "audit_report", runId: run.id });
    return successBody(rows.map((r) => ({
      version: r.versionNo, passed: r.data.passed, totalScore: r.data.totalScore, createdAt: r.createdAt,
    })));
  });

  app.post<{ Params: { runId: string; checkKey: string }; Body: JobBody }>(
    "/runs/:runId/audit/failures/:checkKey/auto-fix",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const job = await startJob(req, deps, me, {
        action: "audit_autofix",
        params: { units: 1, checkKey: req.params.checkKey, stage: "audit" },
        projectId: run.projectId, runId: run.id, body: req.body ?? {},
      });
      return successBody({ jobId: job.id, status: job.status });
    },
  );

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/final-approve", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const report = await current(platform, "audit_report", { runId: run.id });
    if (!report) throw new ApiError("VALIDATION", "No audit report — run the audit first");
    const override = req.body?.override === true;
    if (!report.data.passed && !override) {
      throw new ApiError("VALIDATION", "Latest audit did not pass — fix failures or approve with an override note", {
        totalScore: report.data.totalScore,
      });
    }
    if (!report.data.passed && override && !req.body?.note) {
      throw new ApiError("VALIDATION", "Override requires a note");
    }
    const depth = (report.data.editorialDepth as Obj) ?? {};
    if (Object.values(depth).includes("needs_work") && !override) {
      throw new ApiError("VALIDATION", "Editorial Depth verdict is 'Needs work' — Final Approval is blocked");
    }
    let openIssues = run.openIssues;
    if (!report.data.passed && override) {
      const failures = (report.data.mandatoryFailures as Obj[]) ?? [];
      openIssues = [
        ...openIssues,
        ...failures.map((f) => ({
          id: `audit-${String(f.key)}-${Date.now()}`,
          text: `Audit failure carried into package: ${String(f.key)} — ${String(f.message ?? "")}`,
          kind: "assumption", stage: "audit", status: "open", createdAt: now(),
        })),
      ];
    }
    const script = await currentScript(platform, run.id);
    const scenes = await listScenes(platform, run.id);
    const existingCerts = await platform.listArtifacts({ kind: "certificate", runId: run.id });
    for (const c of existingCerts) {
      await platform.updateArtifact(c.id, { isCurrent: false, status: "superseded" });
    }
    const cert = await platform.createArtifact({
      kind: "certificate", ownerId: me.id, projectId: run.projectId, runId: run.id,
      versionNo: existingCerts.length + 1, isCurrent: true,
      data: {
        runId: run.id,
        topic: run.snapshots.topicTitle ?? run.title,
        auditedVersions: {
          scriptVersion: script?.versionNo ?? null,
          sceneVersion: scenes[0]?.versionNo ?? null,
          auditVersion: report.versionNo,
          bibleVersion: run.snapshots.bibleVersion,
        },
        verdict: report.data.passed ? "passed" : "passed_with_override",
        overrideNote: override ? req.body?.note : undefined,
        failSummary: ((report.data.mandatoryFailures as Obj[]) ?? []).map((f) => f.key),
        naSummary: Object.values((report.data.areas as Obj) ?? {})
          .flatMap((a) => ((a as Obj).checks as Obj[]) ?? [])
          .filter((c) => c.status === "na")
          .map((c) => ({ key: c.key, naReason: c.naReason })),
        auditorProfile: report.data.auditorProfile ?? "deterministic",
        issuedAt: now(),
      },
    });
    const patch = setStage({ ...run, openIssues }, "audit", "done", me.id);
    const updated = await platform.updateRun(run.id, { ...patch, openIssues });
    return successBody({
      approved: true,
      certificateId: cert.id,
      verdict: cert.data.verdict,
      run: publicRun(updated),
    });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/certificate", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const cert = await current(platform, "certificate", { runId: run.id });
    if (!cert) throw new ApiError("NOT_FOUND", "No certificate until final approval");
    return successBody(cert.data);
  });

  /* ---------- package (Step 14) ---------- */
  app.get<{ Params: { runId: string } }>("/runs/:runId/package/checklist", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const answers = (run.snapshots.configAnswers as Obj) ?? {};
    const required = (answers.requiredDeliverables as string[]) ?? [];
    const scenes = await listScenes(platform, run.id);
    const cert = await current(platform, "certificate", { runId: run.id });
    return successBody(
      PACKAGE_DELIVERABLES.map((d) => ({
        key: d.key,
        label: d.label,
        core: d.inclusion === "core",
        kind: d.kind,
        required: d.inclusion === "core" || required.includes(d.key),
        ready:
          d.key === "completionCertificate"
            ? Boolean(cert)
            : scenes.length > 0 || d.kind === "record",
      })),
    );
  });

  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/package/generate", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    if (run.stageMap.audit !== "done") {
      throw new ApiError("STAGE_LOCKED", "Audit must be done before packaging");
    }
    const cert = await current(platform, "certificate", { runId: run.id });
    const deliverables = (req.body?.deliverables as string[]) ?? undefined;
    if (deliverables) {
      const known = new Set(PACKAGE_DELIVERABLES.map((d) => d.key));
      const unknown = deliverables.filter((d) => !known.has(d));
      if (unknown.length > 0) {
        throw new ApiError("VALIDATION", "Unknown deliverable keys rejected at build time", { unknown });
      }
    }
    if (!cert && req.body?.override !== true) {
      throw new ApiError(
        "VALIDATION",
        "Package requires REVISION final approval (certificate), or a recorded override",
      );
    }
    const job = await startJob(req, deps, me, {
      action: "package_generate",
      params: {
        units: 1, stage: "package",
        deliverables, formatProfileId: req.body?.formatProfileId,
      },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/package", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const pkg = await current(platform, "package", { runId: run.id });
    if (!pkg) return successBody(null);
    return successBody({
      version: pkg.versionNo,
      ...pkg.data,
      outdated: Boolean(run.data.packageOutdated) || Boolean(pkg.data.outdated),
    });
  });

  /* ---------- performance (Step 15) ---------- */
  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/performance", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const body = { ...(req.body ?? {}) };
    if (typeof body.youtubeVideoId === "string") {
      const match = body.youtubeVideoId.match(/(?:v=|youtu\.be\/)?([\w-]{11})/);
      if (match) body.youtubeVideoId = match[1];
    }
    const saved = await saveVersioned(platform, {
      kind: "performance_record", ownerId: me.id, projectId: run.projectId, runId: run.id,
      data: { syncStatus: "never", recordedAt: now(), ...body },
    });
    return successBody({ id: saved.id, ...saved.data });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/performance", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const record = await current(platform, "performance_record", { runId: run.id });
    return successBody(record ? { id: record.id, ...record.data } : null);
  });

  app.patch<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/performance", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const record = await current(platform, "performance_record", { runId: run.id });
    if (!record) throw new ApiError("NOT_FOUND", "No performance record yet");
    const updated = await platform.updateArtifact(record.id, { data: { ...record.data, ...(req.body ?? {}) } });
    return successBody({ id: updated.id, ...updated.data });
  });

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/performance/import", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const csv = String(req.body?.csv ?? "");
    const lines = csv.trim().split("\n").filter(Boolean);
    if (lines.length < 2) throw new ApiError("VALIDATION", "CSV needs a header row and at least one data row");
    const headers = lines[0]!.split(",").map((h) => h.trim());
    let imported = 0;
    for (const line of lines.slice(1)) {
      const values = line.split(",");
      const record: Obj = { source: "csv", recordedAt: now(), syncStatus: "never" };
      headers.forEach((h, i) => {
        const raw = values[i]?.trim();
        record[h] = raw !== undefined && raw !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
      });
      await saveVersioned(platform, {
        kind: "performance_record", ownerId: me.id, projectId: run.projectId, runId: run.id,
        data: record,
      });
      imported++;
    }
    return successBody({ imported });
  });

  app.post<{ Params: { runId: string }; Body: JobBody }>(
    "/runs/:runId/performance/insights",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const job = await startJob(req, deps, me, {
        action: "insights_generate",
        params: { units: 1, stage: "performance" },
        projectId: run.projectId, runId: run.id, body: req.body ?? {},
      });
      return successBody({ jobId: job.id, status: job.status });
    },
  );

  app.get<{ Params: { runId: string } }>("/runs/:runId/corrections", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const rows = await platform.listArtifacts({ kind: "correction", runId: run.id });
    return successBody(rows.map((r) => ({ id: r.id, ...r.data })));
  });

  app.post<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/corrections", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const saved = await platform.createArtifact({
      kind: "correction", ownerId: me.id, projectId: run.projectId, runId: run.id,
      versionNo: 1, isCurrent: true,
      data: { ...(req.body ?? {}), createdAt: now() },
    });
    return successBody({ id: saved.id, ...saved.data });
  });

  /* ---------- optional modules 16 / 17 ---------- */
  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/assets/research", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const flags = (await platform.getSetting<{ module16_assets: boolean }>("featureFlags")) ??
      PLATFORM_DEFAULTS.featureFlags;
    if (!flags.module16_assets) throw new ApiError("FEATURE_DISABLED", "Module 16 (asset research) is disabled");
    const job = await startJob(req, deps, me, {
      action: "asset_research",
      params: { units: 1, stage: "assets" },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/assets", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const rows = await platform.listArtifacts({ kind: "asset_item", runId: run.id, currentOnly: true });
    return successBody(rows.map((r) => ({ id: r.id, ...r.data })));
  });

  app.patch<{ Params: { runId: string; assetId: string }; Body: Obj }>(
    "/runs/:runId/assets/:assetId",
    async (req) => {
      const me = await user(req, deps);
      const run = await ownedRun(deps, me.id, req.params.runId);
      assertRunMutable(run);
      const asset = await platform.getArtifact(req.params.assetId);
      if (!asset || asset.runId !== run.id) throw new ApiError("NOT_FOUND", "Asset not found");
      const updated = await platform.updateArtifact(asset.id, { data: { ...asset.data, ...(req.body ?? {}) } });
      return successBody({ id: updated.id, ...updated.data });
    },
  );

  app.post<{ Params: { runId: string }; Body: JobBody }>("/runs/:runId/publishing/generate", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const flags = (await platform.getSetting<{ module17_publishing: boolean }>("featureFlags")) ??
      PLATFORM_DEFAULTS.featureFlags;
    if (!flags.module17_publishing) throw new ApiError("FEATURE_DISABLED", "Module 17 (publishing optimisation) is disabled");
    const job = await startJob(req, deps, me, {
      action: "publishing_generate",
      params: { units: 1, stage: "publishing" },
      projectId: run.projectId, runId: run.id, body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.get<{ Params: { runId: string } }>("/runs/:runId/publishing", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    const pub = await current(platform, "publishing", { runId: run.id });
    return successBody(pub?.data ?? null);
  });

  app.patch<{ Params: { runId: string }; Body: Obj }>("/runs/:runId/publishing", async (req) => {
    const me = await user(req, deps);
    const run = await ownedRun(deps, me.id, req.params.runId);
    assertRunMutable(run);
    const pub = await current(platform, "publishing", { runId: run.id });
    if (!pub) throw new ApiError("NOT_FOUND", "No publishing output yet");
    const updated = await platform.updateArtifact(pub.id, { data: { ...pub.data, ...(req.body ?? {}) } });
    return successBody(updated.data);
  });
}

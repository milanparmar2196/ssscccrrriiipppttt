import type { FastifyRequest } from "fastify";
import { ApiError } from "../errors.js";
import { requireUser } from "../auth/guards.js";
import type { UserRecord } from "../auth/store.js";
import type { AppDeps } from "../deps.js";
import type { ProjectRecord, RunRecord } from "../platform/store.js";
import { createJob } from "../jobs/engine.js";

export async function user(req: FastifyRequest, deps: AppDeps): Promise<UserRecord> {
  return requireUser(deps.auth.store, req);
}

export async function ownedProject(
  deps: AppDeps,
  userId: string,
  projectId: string,
): Promise<ProjectRecord> {
  const project = await deps.platform.getProject(projectId);
  if (!project || (project.ownerId !== userId && !project.isSample)) {
    throw new ApiError("NOT_FOUND", "Project not found");
  }
  return project;
}

export function assertProjectMutable(project: ProjectRecord): void {
  if (project.isSample) throw new ApiError("SAMPLE_READ_ONLY", "The sample project is read-only");
  if (project.lifecycleStatus === "archived") {
    throw new ApiError("CONFLICT", "Project is archived (read-only)");
  }
  if (project.lifecycleStatus === "pending_deletion") {
    throw new ApiError("CONFLICT", "Project is scheduled for deletion");
  }
}

export async function ownedRun(
  deps: AppDeps,
  userId: string,
  runId: string,
): Promise<RunRecord> {
  const run = await deps.platform.getRun(runId);
  if (!run || run.ownerId !== userId) throw new ApiError("NOT_FOUND", "Run not found");
  return run;
}

export function assertRunMutable(run: RunRecord): void {
  if (run.lifecycleStatus === "archived") {
    throw new ApiError("CONFLICT", "Run is archived (read-only)");
  }
  if (run.lifecycleStatus === "pending_deletion") {
    throw new ApiError("CONFLICT", "Run is scheduled for deletion");
  }
}

export interface JobBody {
  jobConfirm?: { estimatedCredits: number };
  [key: string]: unknown;
}

export async function startJob(
  req: FastifyRequest,
  deps: AppDeps,
  user: UserRecord,
  input: {
    action: string;
    params: Record<string, unknown>;
    projectId?: string;
    runId?: string;
    body: JobBody;
  },
) {
  const idempotencyKey = req.headers["idempotency-key"];
  const job = await createJob(deps, user, {
    action: input.action,
    params: input.params,
    projectId: input.projectId,
    runId: input.runId,
    jobConfirm: input.body.jobConfirm,
    idempotencyKey: typeof idempotencyKey === "string" ? idempotencyKey : undefined,
  });
  return job;
}

export function publicProject(p: ProjectRecord) {
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    platform: p.platform,
    lifecycleStatus: p.lifecycleStatus,
    isSample: p.isSample,
    brandId: p.brandId,
    settings: (p.data.settings as Record<string, unknown>) ?? {},
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function publicRun(r: RunRecord) {
  return {
    id: r.id,
    projectId: r.projectId,
    title: r.title,
    lifecycleStatus: r.lifecycleStatus,
    stageMap: r.stageMap,
    stageHistory: r.stageHistory,
    selectedTopicId: r.selectedTopicId,
    snapshots: {
      bibleVersion: r.snapshots.bibleVersion,
      configVersion: r.snapshots.configVersion,
      topicTitle: r.snapshots.topicTitle,
      angle: r.snapshots.angle,
      storyQuestion: r.snapshots.storyQuestion,
      generatorProfile: r.snapshots.generatorProfile,
    },
    openIssues: r.openIssues,
    packageOutdated: Boolean(r.data.packageOutdated),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

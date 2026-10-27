import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import {
  artifacts,
  jobs,
  libraryRecords,
  platformSettings,
  projects,
  runs,
} from "../db/platform-schema.js";
import type {
  ArtifactFilter,
  ArtifactRecord,
  JobRecord,
  LibraryRecord,
  PlatformStore,
  ProjectRecord,
  RunRecord,
} from "./store.js";

type P = typeof projects.$inferSelect;
type R = typeof runs.$inferSelect;
type J = typeof jobs.$inferSelect;
type A = typeof artifacts.$inferSelect;
type L = typeof libraryRecords.$inferSelect;

const toProject = (r: P): ProjectRecord => ({
  id: r.id, ownerId: r.ownerId, type: r.type as ProjectRecord["type"], name: r.name,
  platform: r.platform, lifecycleStatus: r.lifecycleStatus, isSample: r.isSample,
  brandId: r.brandId ?? undefined, data: (r.data ?? {}) as Record<string, unknown>,
  deletionRequestedAt: r.deletionRequestedAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
});
const toRun = (r: R): RunRecord => ({
  id: r.id, projectId: r.projectId, ownerId: r.ownerId, title: r.title,
  lifecycleStatus: r.lifecycleStatus, stageMap: (r.stageMap ?? {}) as Record<string, string>,
  stageHistory: (r.stageHistory ?? []) as Array<Record<string, unknown>>,
  selectedTopicId: r.selectedTopicId ?? null,
  snapshots: (r.snapshots ?? {}) as Record<string, unknown>,
  openIssues: (r.openIssues ?? []) as Array<Record<string, unknown>>,
  data: (r.data ?? {}) as Record<string, unknown>,
  deletionRequestedAt: r.deletionRequestedAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
});
const toJob = (r: J): JobRecord => ({
  id: r.id, userId: r.userId, action: r.action, status: r.status as JobRecord["status"],
  projectId: r.projectId ?? undefined, runId: r.runId ?? undefined,
  idempotencyKey: r.idempotencyKey ?? undefined,
  params: (r.params ?? {}) as Record<string, unknown>,
  estimatedCredits: r.estimatedCredits, creditsCharged: r.creditsCharged,
  unitsTotal: r.unitsTotal ?? undefined, unitsDone: r.unitsDone,
  progressPct: r.progressPct ?? undefined, resultRefs: (r.resultRefs ?? []) as unknown[],
  result: (r.result as Record<string, unknown> | null) ?? null,
  error: (r.error as Record<string, unknown> | null) ?? null,
  modelUsed: r.modelUsed ?? undefined, tokensIn: r.tokensIn ?? undefined,
  tokensOut: r.tokensOut ?? undefined,
  createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
});
const toArtifact = (r: A): ArtifactRecord => ({
  id: r.id, kind: r.kind, ownerId: r.ownerId, projectId: r.projectId ?? undefined,
  runId: r.runId ?? undefined, key: r.key ?? undefined, versionNo: r.versionNo,
  isCurrent: r.isCurrent, status: r.status ?? undefined,
  data: (r.data ?? {}) as Record<string, unknown>,
  createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
});
const toLibrary = (r: L): LibraryRecord => ({
  id: r.id, kind: r.kind, recordKey: r.recordKey,
  payload: (r.payload ?? {}) as Record<string, unknown>,
  version: r.version, status: r.status, updatedBy: r.updatedBy ?? undefined,
});

export class DrizzlePlatformStore implements PlatformStore {
  async createProject(p: Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">) {
    const rows = await getDb().insert(projects).values({
      ownerId: p.ownerId, type: p.type, name: p.name, platform: p.platform,
      lifecycleStatus: p.lifecycleStatus, isSample: p.isSample, brandId: p.brandId,
      data: p.data,
    }).returning();
    return toProject(rows[0]!);
  }
  async getProject(id: string) {
    const rows = await getDb().select().from(projects).where(eq(projects.id, id)).limit(1);
    return rows[0] ? toProject(rows[0]) : undefined;
  }
  async listProjects(ownerId: string, opts?: { includeArchived?: boolean; includeSample?: boolean }) {
    const rows = await getDb().select().from(projects).where(
      opts?.includeSample
        ? sql`${projects.ownerId} = ${ownerId} OR ${projects.isSample} = true`
        : eq(projects.ownerId, ownerId),
    );
    return rows.map(toProject).filter(
      (p) => opts?.includeArchived || p.lifecycleStatus === "active" || p.isSample,
    );
  }
  async updateProject(id: string, patch: Partial<ProjectRecord>) {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["name", "platform", "type", "lifecycleStatus", "brandId", "data"] as const) {
      if (patch[k] !== undefined) set[k] = patch[k];
    }
    if (patch.deletionRequestedAt !== undefined) {
      set.deletionRequestedAt = patch.deletionRequestedAt ? new Date(patch.deletionRequestedAt) : null;
    }
    const rows = await getDb().update(projects).set(set).where(eq(projects.id, id)).returning();
    return toProject(rows[0]!);
  }
  async listAllProjects() {
    const rows = await getDb().select().from(projects);
    return rows.map(toProject);
  }
  async listAllRuns() {
    const rows = await getDb().select().from(runs);
    return rows.map(toRun);
  }
  async deleteProjectRows(id: string) {
    const db = getDb();
    await db.delete(artifacts).where(eq(artifacts.projectId, id));
    await db.delete(runs).where(eq(runs.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  async createRun(r: Omit<RunRecord, "id" | "createdAt" | "updatedAt">) {
    const rows = await getDb().insert(runs).values({
      projectId: r.projectId, ownerId: r.ownerId, title: r.title,
      lifecycleStatus: r.lifecycleStatus, stageMap: r.stageMap,
      stageHistory: r.stageHistory, selectedTopicId: r.selectedTopicId,
      snapshots: r.snapshots, openIssues: r.openIssues, data: r.data,
    }).returning();
    return toRun(rows[0]!);
  }
  async getRun(id: string) {
    const rows = await getDb().select().from(runs).where(eq(runs.id, id)).limit(1);
    return rows[0] ? toRun(rows[0]) : undefined;
  }
  async listRuns(projectId: string) {
    const rows = await getDb().select().from(runs).where(eq(runs.projectId, projectId));
    return rows.map(toRun);
  }
  async listRunsForOwner(ownerId: string) {
    const rows = await getDb().select().from(runs).where(eq(runs.ownerId, ownerId));
    return rows.map(toRun);
  }
  async updateRun(id: string, patch: Partial<RunRecord>) {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["title", "lifecycleStatus", "stageMap", "stageHistory", "selectedTopicId", "snapshots", "openIssues", "data"] as const) {
      if (patch[k] !== undefined) set[k] = patch[k];
    }
    if (patch.deletionRequestedAt !== undefined) {
      set.deletionRequestedAt = patch.deletionRequestedAt ? new Date(patch.deletionRequestedAt) : null;
    }
    const rows = await getDb().update(runs).set(set).where(eq(runs.id, id)).returning();
    return toRun(rows[0]!);
  }
  async deleteRunRows(id: string) {
    const db = getDb();
    await db.delete(artifacts).where(eq(artifacts.runId, id));
    await db.delete(runs).where(eq(runs.id, id));
  }

  async createJob(j: Omit<JobRecord, "id" | "createdAt" | "updatedAt">) {
    const rows = await getDb().insert(jobs).values({
      userId: j.userId, action: j.action, status: j.status, projectId: j.projectId,
      runId: j.runId, idempotencyKey: j.idempotencyKey, params: j.params,
      estimatedCredits: j.estimatedCredits, creditsCharged: j.creditsCharged,
      unitsTotal: j.unitsTotal, unitsDone: j.unitsDone, progressPct: j.progressPct,
      resultRefs: j.resultRefs, result: j.result, error: j.error,
    }).returning();
    return toJob(rows[0]!);
  }
  async getJob(id: string) {
    const rows = await getDb().select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return rows[0] ? toJob(rows[0]) : undefined;
  }
  async getJobByIdempotency(userId: string, key: string) {
    const rows = await getDb().select().from(jobs).where(
      and(eq(jobs.userId, userId), eq(jobs.idempotencyKey, key)),
    ).limit(1);
    return rows[0] ? toJob(rows[0]) : undefined;
  }
  async updateJob(id: string, patch: Partial<JobRecord>) {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["status", "creditsCharged", "unitsTotal", "unitsDone", "progressPct", "resultRefs", "result", "error", "modelUsed", "tokensIn", "tokensOut"] as const) {
      if (patch[k] !== undefined) set[k] = patch[k];
    }
    const rows = await getDb().update(jobs).set(set).where(eq(jobs.id, id)).returning();
    return toJob(rows[0]!);
  }
  async countQueuedOrRunningJobs(userId: string) {
    const rows = await getDb().select({ n: sql<number>`count(*)::int` }).from(jobs).where(
      and(eq(jobs.userId, userId), sql`${jobs.status} IN ('queued','running')`),
    );
    return rows[0]?.n ?? 0;
  }
  async listJobs(f: { userId?: string; projectId?: string; runId?: string; status?: string }) {
    const conds = [];
    if (f.userId !== undefined) conds.push(eq(jobs.userId, f.userId));
    if (f.projectId !== undefined) conds.push(eq(jobs.projectId, f.projectId));
    if (f.runId !== undefined) conds.push(eq(jobs.runId, f.runId));
    if (f.status !== undefined) conds.push(eq(jobs.status, f.status));
    const rows = conds.length
      ? await getDb().select().from(jobs).where(and(...conds))
      : await getDb().select().from(jobs);
    return rows.map(toJob);
  }
  async findRunningJobForRunStage(runId: string, stage: string) {
    const rows = await getDb().select().from(jobs).where(
      and(eq(jobs.runId, runId), eq(jobs.status, "running")),
    );
    const found = rows.map(toJob).find((j) => (j.params as { stage?: string }).stage === stage);
    return found;
  }

  async createArtifact(a: Omit<ArtifactRecord, "id" | "createdAt" | "updatedAt">) {
    const rows = await getDb().insert(artifacts).values({
      kind: a.kind, ownerId: a.ownerId, projectId: a.projectId, runId: a.runId,
      key: a.key, versionNo: a.versionNo, isCurrent: a.isCurrent, status: a.status, data: a.data,
    }).returning();
    return toArtifact(rows[0]!);
  }
  async getArtifact(id: string) {
    const rows = await getDb().select().from(artifacts).where(eq(artifacts.id, id)).limit(1);
    return rows[0] ? toArtifact(rows[0]) : undefined;
  }
  async listArtifacts(f: ArtifactFilter) {
    const conds = [];
    if (f.kind !== undefined) conds.push(eq(artifacts.kind, f.kind));
    if (f.ownerId !== undefined) conds.push(eq(artifacts.ownerId, f.ownerId));
    if (f.projectId !== undefined) conds.push(eq(artifacts.projectId, f.projectId));
    if (f.runId !== undefined) conds.push(eq(artifacts.runId, f.runId));
    if (f.key !== undefined) conds.push(eq(artifacts.key, f.key));
    if (f.currentOnly) conds.push(eq(artifacts.isCurrent, true));
    const rows = conds.length
      ? await getDb().select().from(artifacts).where(and(...conds))
      : await getDb().select().from(artifacts);
    return rows.map(toArtifact);
  }
  async updateArtifact(id: string, patch: Partial<ArtifactRecord>) {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["data", "isCurrent", "status", "versionNo", "key"] as const) {
      if (patch[k] !== undefined) set[k] = patch[k];
    }
    const rows = await getDb().update(artifacts).set(set).where(eq(artifacts.id, id)).returning();
    return toArtifact(rows[0]!);
  }
  async deleteArtifact(id: string) {
    await getDb().delete(artifacts).where(eq(artifacts.id, id));
  }
  async deleteArtifactsWhere(f: Partial<ArtifactFilter>) {
    const conds = [];
    if (f.kind !== undefined) conds.push(eq(artifacts.kind, f.kind));
    if (f.projectId !== undefined) conds.push(eq(artifacts.projectId, f.projectId));
    if (f.runId !== undefined) conds.push(eq(artifacts.runId, f.runId));
    if (conds.length) await getDb().delete(artifacts).where(and(...conds));
  }

  async getLibraryRecord(kind: string, recordKey: string) {
    const rows = await getDb().select().from(libraryRecords).where(
      and(eq(libraryRecords.kind, kind), eq(libraryRecords.recordKey, recordKey)),
    ).limit(1);
    return rows[0] ? toLibrary(rows[0]) : undefined;
  }
  async putLibraryRecord(r: Omit<LibraryRecord, "id">) {
    const db = getDb();
    const existing = await this.getLibraryRecord(r.kind, r.recordKey);
    if (existing) {
      const rows = await db.update(libraryRecords).set({
        payload: r.payload, version: r.version, status: r.status,
        updatedBy: r.updatedBy, updatedAt: new Date(),
      }).where(eq(libraryRecords.id, existing.id)).returning();
      return toLibrary(rows[0]!);
    }
    const rows = await db.insert(libraryRecords).values({
      kind: r.kind, recordKey: r.recordKey, payload: r.payload,
      version: r.version, status: r.status, updatedBy: r.updatedBy,
    }).returning();
    return toLibrary(rows[0]!);
  }
  async listLibraryRecords(kind: string) {
    const rows = await getDb().select().from(libraryRecords).where(eq(libraryRecords.kind, kind));
    return rows.map(toLibrary);
  }
  async deleteLibraryRecord(kind: string, recordKey: string) {
    await getDb().delete(libraryRecords).where(
      and(eq(libraryRecords.kind, kind), eq(libraryRecords.recordKey, recordKey)),
    );
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const rows = await getDb().select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
    return rows[0]?.value as T | undefined;
  }
  async setSetting(key: string, value: unknown) {
    await getDb().insert(platformSettings).values({ key, value: value as never })
      .onConflictDoUpdate({ target: platformSettings.key, set: { value: value as never, updatedAt: new Date() } });
  }
}

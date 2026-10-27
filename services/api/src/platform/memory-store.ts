import { randomUUID } from "node:crypto";
import type {
  ArtifactFilter,
  ArtifactRecord,
  JobRecord,
  LibraryRecord,
  PlatformStore,
  ProjectRecord,
  RunRecord,
} from "./store.js";

const now = () => new Date().toISOString();

export class MemoryPlatformStore implements PlatformStore {
  projects = new Map<string, ProjectRecord>();
  runs = new Map<string, RunRecord>();
  jobs = new Map<string, JobRecord>();
  artifacts = new Map<string, ArtifactRecord>();
  library = new Map<string, LibraryRecord>();
  settings = new Map<string, unknown>();

  async createProject(p: Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">) {
    const rec = { ...p, id: randomUUID(), createdAt: now(), updatedAt: now() };
    this.projects.set(rec.id, rec);
    return rec;
  }
  async getProject(id: string) { return this.projects.get(id); }
  async listProjects(ownerId: string, opts?: { includeArchived?: boolean; includeSample?: boolean }) {
    return [...this.projects.values()].filter(
      (p) =>
        (p.ownerId === ownerId || (opts?.includeSample && p.isSample)) &&
        (opts?.includeArchived || p.lifecycleStatus === "active" || p.isSample),
    );
  }
  async updateProject(id: string, patch: Partial<ProjectRecord>) {
    const cur = this.projects.get(id);
    if (!cur) throw new Error(`project ${id} not found`);
    const next = { ...cur, ...patch, updatedAt: now() };
    this.projects.set(id, next);
    return next;
  }
  async listAllProjects() { return [...this.projects.values()]; }
  async listAllRuns() { return [...this.runs.values()]; }
  async deleteProjectRows(id: string) {
    this.projects.delete(id);
    for (const [k, a] of this.artifacts) if (a.projectId === id) this.artifacts.delete(k);
    for (const [k, r] of this.runs) if (r.projectId === id) this.runs.delete(k);
  }

  async createRun(r: Omit<RunRecord, "id" | "createdAt" | "updatedAt">) {
    const rec = { ...r, id: randomUUID(), createdAt: now(), updatedAt: now() };
    this.runs.set(rec.id, rec);
    return rec;
  }
  async getRun(id: string) { return this.runs.get(id); }
  async listRuns(projectId: string) {
    return [...this.runs.values()].filter((r) => r.projectId === projectId);
  }
  async listRunsForOwner(ownerId: string) {
    return [...this.runs.values()].filter((r) => r.ownerId === ownerId);
  }
  async updateRun(id: string, patch: Partial<RunRecord>) {
    const cur = this.runs.get(id);
    if (!cur) throw new Error(`run ${id} not found`);
    const next = { ...cur, ...patch, updatedAt: now() };
    this.runs.set(id, next);
    return next;
  }
  async deleteRunRows(id: string) {
    this.runs.delete(id);
    for (const [k, a] of this.artifacts) if (a.runId === id) this.artifacts.delete(k);
  }

  async createJob(j: Omit<JobRecord, "id" | "createdAt" | "updatedAt">) {
    const rec = { ...j, id: randomUUID(), createdAt: now(), updatedAt: now() };
    this.jobs.set(rec.id, rec);
    return rec;
  }
  async getJob(id: string) { return this.jobs.get(id); }
  async getJobByIdempotency(userId: string, key: string) {
    return [...this.jobs.values()].find((j) => j.userId === userId && j.idempotencyKey === key);
  }
  async updateJob(id: string, patch: Partial<JobRecord>) {
    const cur = this.jobs.get(id);
    if (!cur) throw new Error(`job ${id} not found`);
    const next = { ...cur, ...patch, updatedAt: now() };
    this.jobs.set(id, next);
    return next;
  }
  async countQueuedOrRunningJobs(userId: string) {
    return [...this.jobs.values()].filter(
      (j) => j.userId === userId && (j.status === "queued" || j.status === "running"),
    ).length;
  }
  async listJobs(f: { userId?: string; projectId?: string; runId?: string; status?: string }) {
    return [...this.jobs.values()].filter(
      (j) =>
        (f.userId === undefined || j.userId === f.userId) &&
        (f.projectId === undefined || j.projectId === f.projectId) &&
        (f.runId === undefined || j.runId === f.runId) &&
        (f.status === undefined || j.status === f.status),
    );
  }
  async findRunningJobForRunStage(runId: string, stage: string) {
    return [...this.jobs.values()].find(
      (j) => j.runId === runId && j.status === "running" && (j.params as { stage?: string }).stage === stage,
    );
  }

  async createArtifact(a: Omit<ArtifactRecord, "id" | "createdAt" | "updatedAt">) {
    const rec = { ...a, id: randomUUID(), createdAt: now(), updatedAt: now() };
    this.artifacts.set(rec.id, rec);
    return rec;
  }
  async getArtifact(id: string) { return this.artifacts.get(id); }
  async listArtifacts(f: ArtifactFilter) {
    return [...this.artifacts.values()].filter(
      (a) =>
        (f.kind === undefined || a.kind === f.kind) &&
        (f.ownerId === undefined || a.ownerId === f.ownerId) &&
        (f.projectId === undefined || a.projectId === f.projectId) &&
        (f.runId === undefined || a.runId === f.runId) &&
        (f.key === undefined || a.key === f.key) &&
        (!f.currentOnly || a.isCurrent),
    );
  }
  async updateArtifact(id: string, patch: Partial<ArtifactRecord>) {
    const cur = this.artifacts.get(id);
    if (!cur) throw new Error(`artifact ${id} not found`);
    const next = { ...cur, ...patch, updatedAt: now() };
    this.artifacts.set(id, next);
    return next;
  }
  async deleteArtifact(id: string) { this.artifacts.delete(id); }
  async deleteArtifactsWhere(f: Partial<ArtifactFilter>) {
    for (const [k, a] of this.artifacts) {
      if (
        (f.kind === undefined || a.kind === f.kind) &&
        (f.projectId === undefined || a.projectId === f.projectId) &&
        (f.runId === undefined || a.runId === f.runId)
      ) {
        this.artifacts.delete(k);
      }
    }
  }

  async getLibraryRecord(kind: string, recordKey: string) {
    return this.library.get(`${kind}::${recordKey}`);
  }
  async putLibraryRecord(r: Omit<LibraryRecord, "id">) {
    const key = `${r.kind}::${r.recordKey}`;
    const existing = this.library.get(key);
    const rec: LibraryRecord = { ...r, id: existing?.id ?? randomUUID() };
    this.library.set(key, rec);
    return rec;
  }
  async listLibraryRecords(kind: string) {
    return [...this.library.values()].filter((r) => r.kind === kind);
  }
  async deleteLibraryRecord(kind: string, recordKey: string) {
    this.library.delete(`${kind}::${recordKey}`);
  }

  async getSetting<T>(key: string) { return this.settings.get(key) as T | undefined; }
  async setSetting(key: string, value: unknown) { this.settings.set(key, value); }
}

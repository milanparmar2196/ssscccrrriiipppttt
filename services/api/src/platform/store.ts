/** PlatformStore — projects/runs/jobs/artifacts/library persistence. */
export interface ProjectRecord {
  id: string;
  ownerId: string;
  type: "personal" | "brand";
  name: string;
  platform: string;
  lifecycleStatus: string;
  isSample: boolean;
  brandId?: string;
  data: Record<string, unknown>;
  deletionRequestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunRecord {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  lifecycleStatus: string;
  stageMap: Record<string, string>;
  stageHistory: Array<Record<string, unknown>>;
  selectedTopicId?: string | null;
  snapshots: Record<string, unknown>;
  openIssues: Array<Record<string, unknown>>;
  data: Record<string, unknown>;
  deletionRequestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobRecord {
  id: string;
  userId: string;
  action: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  projectId?: string;
  runId?: string;
  idempotencyKey?: string;
  params: Record<string, unknown>;
  estimatedCredits: number;
  creditsCharged: number;
  unitsTotal?: number;
  unitsDone: number;
  progressPct?: number;
  resultRefs: unknown[];
  result?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
  modelUsed?: string;
  tokensIn?: number;
  tokensOut?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactRecord {
  id: string;
  kind: string;
  ownerId: string;
  projectId?: string;
  runId?: string;
  key?: string;
  versionNo: number;
  isCurrent: boolean;
  status?: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactFilter {
  kind?: string;
  ownerId?: string;
  projectId?: string;
  runId?: string;
  key?: string;
  currentOnly?: boolean;
}

export interface LibraryRecord {
  id: string;
  kind: string;
  recordKey: string;
  payload: Record<string, unknown>;
  version: number;
  status: string;
  updatedBy?: string;
}

export interface PlatformStore {
  createProject(p: Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">): Promise<ProjectRecord>;
  getProject(id: string): Promise<ProjectRecord | undefined>;
  listProjects(ownerId: string, opts?: { includeArchived?: boolean; includeSample?: boolean }): Promise<ProjectRecord[]>;
  updateProject(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord>;
  deleteProjectRows(id: string): Promise<void>;
  listAllProjects(): Promise<ProjectRecord[]>;
  listAllRuns(): Promise<RunRecord[]>;

  createRun(r: Omit<RunRecord, "id" | "createdAt" | "updatedAt">): Promise<RunRecord>;
  getRun(id: string): Promise<RunRecord | undefined>;
  listRuns(projectId: string): Promise<RunRecord[]>;
  listRunsForOwner(ownerId: string): Promise<RunRecord[]>;
  updateRun(id: string, patch: Partial<RunRecord>): Promise<RunRecord>;
  deleteRunRows(id: string): Promise<void>;

  createJob(j: Omit<JobRecord, "id" | "createdAt" | "updatedAt">): Promise<JobRecord>;
  getJob(id: string): Promise<JobRecord | undefined>;
  getJobByIdempotency(userId: string, key: string): Promise<JobRecord | undefined>;
  updateJob(id: string, patch: Partial<JobRecord>): Promise<JobRecord>;
  countQueuedOrRunningJobs(userId: string): Promise<number>;
  listJobs(f: { userId?: string; projectId?: string; runId?: string; status?: string }): Promise<JobRecord[]>;
  findRunningJobForRunStage(runId: string, stage: string): Promise<JobRecord | undefined>;

  createArtifact(a: Omit<ArtifactRecord, "id" | "createdAt" | "updatedAt">): Promise<ArtifactRecord>;
  getArtifact(id: string): Promise<ArtifactRecord | undefined>;
  listArtifacts(f: ArtifactFilter): Promise<ArtifactRecord[]>;
  updateArtifact(id: string, patch: Partial<ArtifactRecord>): Promise<ArtifactRecord>;
  deleteArtifact(id: string): Promise<void>;
  deleteArtifactsWhere(f: Partial<ArtifactFilter>): Promise<void>;

  getLibraryRecord(kind: string, recordKey: string): Promise<LibraryRecord | undefined>;
  putLibraryRecord(r: Omit<LibraryRecord, "id">): Promise<LibraryRecord>;
  listLibraryRecords(kind: string): Promise<LibraryRecord[]>;
  deleteLibraryRecord(kind: string, recordKey: string): Promise<void>;

  getSetting<T>(key: string): Promise<T | undefined>;
  setSetting(key: string, value: unknown): Promise<void>;
}

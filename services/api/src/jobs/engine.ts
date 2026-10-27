/**
 * Jobs & credits engine (API §7). Estimate -> confirm -> hold ->
 * execute -> capture/release. Idempotency-Key dedupes. Cancellation
 * stops at unit boundaries; completed units charge at actual cost.
 */
import { ApiError } from "../errors.js";
import type { AppDeps } from "../deps.js";
import { assertVerifiedForJobs } from "../auth/service.js";
import type { UserRecord } from "../auth/store.js";
import { PLATFORM_DEFAULTS } from "../platform/settings.js";
import type { JobRecord } from "../platform/store.js";
import { notifyUser } from "../platform/notify.js";

export interface JobContext {
  deps: AppDeps;
  job: JobRecord;
  user: UserRecord;
  /** Report progress; throws CancelledError at a unit boundary. */
  checkpoint(unitsDone: number, unitsTotal?: number): Promise<void>;
  setResult(patch: Partial<JobRecord>): Promise<void>;
}

export class CancelledError extends Error {
  code = "CANCELLED";
}

export type JobHandler = (
  ctx: JobContext,
) => Promise<{ result?: Record<string, unknown>; resultRefs?: unknown[]; actualCredits?: number }>;

const handlers = new Map<string, JobHandler>();
export function registerHandler(action: string, handler: JobHandler): void {
  handlers.set(action, handler);
}
export function getHandler(action: string): JobHandler | undefined {
  return handlers.get(action);
}

const cancelRequested = new Set<string>();
export function requestCancel(jobId: string): void {
  cancelRequested.add(jobId);
}

export async function estimateCredits(
  deps: AppDeps,
  action: string,
  params: Record<string, unknown>,
): Promise<{ estimatedCredits: number; breakdown: Record<string, unknown> }> {
  const costs = (await deps.platform.getSetting<Record<string, number>>("jobCosts")) ??
    PLATFORM_DEFAULTS.jobCosts;
  const base = costs[action] ?? 5;
  const units = Number(params.units ?? 1) || 1;
  const estimatedCredits = base * units;
  return { estimatedCredits, breakdown: { basePerUnit: base, units, action } };
}

export interface CreateJobInput {
  action: string;
  params: Record<string, unknown>;
  projectId?: string;
  runId?: string;
  jobConfirm?: { estimatedCredits: number };
  idempotencyKey?: string;
}

export async function createJob(
  deps: AppDeps,
  user: UserRecord,
  input: CreateJobInput,
): Promise<JobRecord> {
  assertVerifiedForJobs(user);
  if (input.idempotencyKey) {
    const existing = await deps.platform.getJobByIdempotency(user.id, input.idempotencyKey);
    if (existing) return existing;
  }
  const { estimatedCredits, breakdown } = await estimateCredits(deps, input.action, input.params);
  if (!input.jobConfirm || input.jobConfirm.estimatedCredits !== estimatedCredits) {
    throw new ApiError("VALIDATION", "Credit estimate changed — confirm the new estimate", {
      estimatedCredits,
      breakdown,
    });
  }
  const balance = await deps.auth.store.ledgerBalance(user.id);
  if (balance < estimatedCredits) {
    throw new ApiError("INSUFFICIENT_CREDITS", "Not enough credits for this job", {
      balance,
      estimatedCredits,
    });
  }
  const job = await deps.platform.createJob({
    userId: user.id,
    action: input.action,
    status: "queued",
    projectId: input.projectId,
    runId: input.runId,
    idempotencyKey: input.idempotencyKey,
    params: input.params,
    estimatedCredits,
    creditsCharged: 0,
    unitsDone: 0,
    resultRefs: [],
  });
  await deps.auth.store.addLedgerEntry({
    userId: user.id,
    kind: "hold",
    amount: -estimatedCredits,
    jobId: job.id,
    note: `${input.action} hold`,
    actor: "system",
  });
  deps.enqueueJob(job.id);
  return job;
}

async function captureHold(deps: AppDeps, job: JobRecord, actual: number): Promise<void> {
  await deps.auth.store.addLedgerEntry({
    userId: job.userId, kind: "release", amount: job.estimatedCredits, jobId: job.id,
    note: `${job.action} hold released`, actor: "system",
  });
  if (actual > 0) {
    await deps.auth.store.addLedgerEntry({
      userId: job.userId, kind: "charge", amount: -actual, jobId: job.id,
      note: `${job.action} charge`, actor: "system",
    });
  }
}

async function releaseHold(deps: AppDeps, job: JobRecord): Promise<void> {
  if (job.estimatedCredits > 0) {
    await deps.auth.store.addLedgerEntry({
      userId: job.userId, kind: "release", amount: job.estimatedCredits, jobId: job.id,
      note: `${job.action} hold released (failed/cancelled)`, actor: "system",
    });
  }
}

export async function executeJob(deps: AppDeps, jobId: string): Promise<void> {
  const job = await deps.platform.getJob(jobId);
  if (!job || job.status !== "queued") return;
  const handler = getHandler(job.action);
  const user = await deps.auth.store.getUserById(job.userId);
  if (!handler || !user) {
    await deps.platform.updateJob(jobId, {
      status: "failed",
      error: { code: "INTERNAL", message: !handler ? `No handler for ${job.action}` : "User not found" },
    });
    await releaseHold(deps, job);
    return;
  }
  await deps.platform.updateJob(jobId, { status: "running" });
  let unitsDone = 0;
  const ctx: JobContext = {
    deps,
    job,
    user,
    async checkpoint(done, total) {
      unitsDone = done;
      const fresh = await deps.platform.getJob(jobId);
      if (cancelRequested.has(jobId) || fresh?.status === "cancelled") {
        throw new CancelledError("Job cancelled");
      }
      await deps.platform.updateJob(jobId, {
        unitsDone: done,
        unitsTotal: total,
        progressPct: total ? Math.round((done / total) * 100) : undefined,
      });
    },
    async setResult(patch) {
      await deps.platform.updateJob(jobId, patch);
    },
  };
  try {
    const out = await handler(ctx);
    const actual = out.actualCredits ?? job.estimatedCredits;
    await captureHold(deps, job, actual);
    await deps.platform.updateJob(jobId, {
      status: "done",
      creditsCharged: actual,
      unitsDone,
      progressPct: 100,
      result: out.result ?? {},
      resultRefs: out.resultRefs ?? [],
    });
    await notifyUser(deps, job.userId, "job_done", { jobId, action: job.action, runId: job.runId });
  } catch (err) {
    if (err instanceof CancelledError) {
      const perUnit = job.unitsTotal ? job.estimatedCredits / Math.max(job.unitsTotal, 1) : 0;
      const actual = Math.round(perUnit * unitsDone);
      await captureHold(deps, job, actual);
      await deps.platform.updateJob(jobId, {
        status: "cancelled",
        creditsCharged: actual,
        unitsDone,
        result: { partial: true, unitsDone },
      });
      await notifyUser(deps, job.userId, "job_cancelled", { jobId, action: job.action });
    } else {
      await releaseHold(deps, job);
      const e = err as Error & { code?: string };
      await deps.platform.updateJob(jobId, {
        status: "failed",
        error: { code: e.code ?? "JOB_FAILED", message: e.message ?? "Job failed" },
      });
      await notifyUser(deps, job.userId, "job_failed", {
        jobId, action: job.action, error: e.message,
      });
    }
  } finally {
    cancelRequested.delete(jobId);
  }
}

export async function cancelJob(deps: AppDeps, job: JobRecord): Promise<JobRecord> {
  if (job.status === "queued") {
    await releaseHold(deps, job);
    return deps.platform.updateJob(job.id, { status: "cancelled", creditsCharged: 0 });
  }
  if (job.status === "running") {
    requestCancel(job.id);
    return job;
  }
  return job;
}

/** In-process runner (dev/tests). Production swaps in BullMQ (below). */
export class InProcessRunner {
  private queue: string[] = [];
  private active = false;
  constructor(private deps: AppDeps) {}
  enqueue = (jobId: string): void => {
    this.queue.push(jobId);
    void this.pump();
  };
  private async pump(): Promise<void> {
    if (this.active) return;
    this.active = true;
    try {
      while (this.queue.length > 0) {
        const id = this.queue.shift()!;
        await executeJob(this.deps, id);
      }
    } finally {
      this.active = false;
    }
  }
}

/** BullMQ runner (production path, REDIS_URL set). */
export function createBullMqRunner(deps: AppDeps): (jobId: string) => void {
  let queue: import("bullmq").Queue | undefined;
  let workerStarted = false;
  return (jobId: string) => {
    void (async () => {
      const { Queue, Worker } = await import("bullmq");
      const IORedis = (await import("ioredis")).default;
      const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
      if (!queue) queue = new Queue("jobs", { connection });
      if (!workerStarted) {
        workerStarted = true;
        new Worker(
          "jobs",
          async (bqJob) => {
            await executeJob(deps, String(bqJob.data.jobId));
          },
          { connection },
        );
      }
      await queue.add("run", { jobId }, { jobId });
    })();
  };
}

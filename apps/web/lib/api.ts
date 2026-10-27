"use client";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ACCESS_KEY = "sw_access_token";
const REFRESH_KEY = "sw_refresh_token";

export class ApiError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;
  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details ?? {};
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh?: string): void {
  window.localStorage.setItem(ACCESS_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function idempotencyKey(): string {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // default true
  _retried?: boolean;
}

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.auth !== false) {
    const token = getAccessToken();
    if (token) headers["authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  if (res.status === 401 && !opts._retried && opts.auth !== false && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) return api<T>(path, { ...opts, _retried: true });
  }
  if (!res.ok) {
    const err = json?.error ?? {};
    throw new ApiError(res.status, err.code ?? "ERROR", err.message ?? `Request failed (${res.status})`, err.details);
  }
  return (json?.data ?? json) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const data = json?.data ?? {};
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/* ---------------- Jobs ---------------- */

export interface JobEstimate {
  estimatedCredits: number;
  breakdown?: Record<string, unknown>;
  balance?: number;
}

export async function estimateJob(action: string, params: Record<string, unknown> = {}): Promise<JobEstimate> {
  return api<JobEstimate>("/jobs/estimate", { body: { action, params } });
}

export interface JobRecord {
  id: string;
  status: string;
  action?: string;
  progress?: number;
  result?: unknown;
  error?: string;
  [k: string]: unknown;
}

export function jobIdOf(result: any): string | null {
  if (!result) return null;
  return result.jobId ?? result.job?.id ?? result.id ?? null;
}

export async function pollJob(jobId: string, onTick?: (job: JobRecord) => void): Promise<JobRecord> {
  for (;;) {
    const job = await api<JobRecord>(`/jobs/${jobId}`);
    onTick?.(job);
    if (["done", "completed", "succeeded"].includes(job.status)) return job;
    if (["failed", "cancelled", "error"].includes(job.status)) {
      throw new ApiError(500, "JOB_FAILED", job.error ?? `Job ${job.status}`, { job });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

export async function cancelJob(jobId: string): Promise<void> {
  await api(`/jobs/${jobId}/cancel`, { body: {} });
}

/** Run a job-creating call end to end: poll until terminal. */
export async function runJobCall(startResult: any, onTick?: (job: JobRecord) => void): Promise<any> {
  const id = jobIdOf(startResult);
  if (!id) return startResult; // endpoint completed synchronously
  const job = await pollJob(id, onTick);
  return job.result ?? job;
}

export function formatError(e: unknown): string {
  if (e instanceof ApiError) return `${e.message} (${e.code})`;
  if (e instanceof Error) return e.message;
  return String(e);
}

/**
 * Admin API client. Envelope: { data } / { error: { code, message, details } }.
 * Admin tokens live in localStorage under "sw_admin_auth" and are a
 * different token kind from user-app tokens (API enforces this).
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Obj = Record<string, unknown>;

export interface AdminSession {
  accessToken: string;
  refreshToken?: string;
  actor: string;
  role: string;
}

const STORAGE_KEY = "sw_admin_auth";

export function loadSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AdminSession | null): void {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function rawFetch(path: string, init: RequestInit, token?: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

/** One silent refresh attempt using the stored refresh token. */
async function tryRefresh(): Promise<AdminSession | null> {
  const session = loadSession();
  if (!session?.refreshToken) return null;
  try {
    const res = await rawFetch("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { accessToken: string; refreshToken: string } };
    if (!body.data?.accessToken) return null;
    const next: AdminSession = {
      ...session,
      accessToken: body.data.accessToken,
      refreshToken: body.data.refreshToken,
    };
    saveSession(next);
    return next;
  } catch {
    return null;
  }
}

export async function api<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const useAuth = init.auth !== false;
  const session = useAuth ? loadSession() : null;
  const doFetch = (token?: string) =>
    rawFetch(
      path,
      {
        method: init.method ?? "GET",
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      },
      token,
    );
  let res = await doFetch(session?.accessToken);
  if (res.status === 401 && useAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await doFetch(refreshed.accessToken);
  }
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    const err = (parsed as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    if (res.status === 401 && useAuth) {
      saveSession(null);
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw new ApiError(
      res.status,
      err?.code ?? "HTTP_ERROR",
      err?.message ?? `Request failed (${res.status})`,
      err?.details,
    );
  }
  return (parsed as { data: T }).data;
}

export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  const data = await api<{ accessToken: string; refreshToken?: string; actor: string; role: string }>(
    "/admin/auth/login",
    { method: "POST", body: { email, password }, auth: false },
  );
  const session: AdminSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    actor: data.actor,
    role: data.role,
  };
  saveSession(session);
  return session;
}

/** Load helper for pages: loading / error / data state without boilerplate. */
import { useCallback, useEffect, useRef, useState } from "react";

export interface LoadState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): LoadState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((d) => setData(d))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { data, error, loading, reload: run };
}

export function fmt(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function fmtDate(value: unknown): string {
  if (typeof value !== "string") return fmt(value);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

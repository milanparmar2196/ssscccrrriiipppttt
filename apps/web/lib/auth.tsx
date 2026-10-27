"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, clearTokens, formatError, getAccessToken, setTokens } from "./api";

export interface MeUser {
  id: string;
  email: string;
  displayName?: string;
  planKey?: string;
  emailVerifiedAt?: string | null;
  status?: string;
  [k: string]: unknown;
}

interface AuthCtx {
  user: MeUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<MeUser>("/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<any>("/auth/login", { auth: false, body: { email, password } });
      if (data?.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
        await refresh();
      }
      return data;
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { body: {} });
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, refresh, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}

const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname ?? "");

  useEffect(() => {
    if (!loading && !user && !isPublic) router.replace("/login");
  }, [loading, user, isPublic, router]);

  if (isPublic) return <>{children}</>;
  if (loading) return <div className="container muted">Loading…</div>;
  if (!user) return <div className="container muted">Redirecting to login…</div>;
  if (user.status === "suspended") {
    return (
      <div className="container">
        <div className="card">
          <h2>Account suspended</h2>
          <p>
            Your account is suspended, so the workspace is unavailable. Your projects and work are not
            deleted and will return in full if the account is reactivated.
          </p>
          <p className="muted">Please contact the platform team to resolve this.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

/** Slim banner shown to unverified users; generation is gated server-side. */
export function VerifyBanner() {
  const { user, refresh } = useAuth();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user || user.emailVerifiedAt) return null;

  const resend = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await api<any>("/auth/resend-verification", { body: {} });
      setMsg(`Verification email ${r?.emailStatus ?? "sent"}. Check your inbox.`);
      await refresh();
    } catch (e) {
      setMsg(formatError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="banner">
      <strong>Verify your email to run generation.</strong> Browsing, editing, uploads and exports work
      now; generation, research, audit and package jobs need a verified email.{" "}
      <button className="btn small" onClick={resend} disabled={busy}>
        Resend verification
      </button>{" "}
      {msg && <span className="small">{msg}</span>}
    </div>
  );
}

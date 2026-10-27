"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, formatError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { user, refresh } = useAuth();
  const [state, setState] = useState<string>("checking");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    api<any>(`/auth/verify-email/${encodeURIComponent(token)}`, { auth: false })
      .then(async (r) => {
        setState(r?.state ?? "verified");
        await refresh();
      })
      .catch((e: any) => {
        if (e?.code === "TOKEN_EXPIRED") setState("expired");
        else if (e?.code === "TOKEN_USED" || e?.code === "ALREADY_USED") setState("already_used");
        else {
          setState("error");
          setMsg(formatError(e));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resend = async () => {
    setMsg("");
    try {
      const r = await api<any>("/auth/resend-verification", { body: {} });
      setMsg(`A fresh verification email was requested (status: ${r?.emailStatus ?? "sent"}).`);
    } catch (e: any) {
      setMsg(formatError(e));
    }
  };

  return (
    <div className="card">
      {state === "checking" && <p>Verifying your email…</p>}
      {state === "verified" && (
        <>
          <h2>Email verified ✓</h2>
          <p>Generation, research, audit and package jobs are now unlocked.</p>
          <Link className="btn" href={user ? "/projects" : "/login"}>
            Continue
          </Link>
        </>
      )}
      {state === "already_used" && (
        <>
          <h2>Link already used</h2>
          <p>This verification link was already used. If your email shows as verified, you are all set.</p>
          <Link className="btn" href={user ? "/projects" : "/login"}>
            Continue
          </Link>
        </>
      )}
      {state === "expired" && (
        <>
          <h2>Link expired</h2>
          <p>Verification links expire after 24 hours. Request a fresh one below.</p>
          {user ? (
            <button className="btn" onClick={resend}>
              Resend verification email
            </button>
          ) : (
            <p className="muted">
              <Link href="/login">Log in</Link> first, then resend from the banner at the top of the app.
            </p>
          )}
        </>
      )}
      {(state === "invalid" || state === "error") && (
        <>
          <h2>Verification link problem</h2>
          <p>{msg || "This link is not valid. Open the most recent verification email and try again."}</p>
        </>
      )}
      {msg && state !== "error" && <p className="small muted">{msg}</p>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <h1>Email verification</h1>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <VerifyInner />
      </Suspense>
    </main>
  );
}

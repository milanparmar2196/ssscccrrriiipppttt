"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formatError, setTokens } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ErrorBox } from "../../components/ui";

export default function LoginPage() {
  const { login, refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setPendingDeletion(false);
    try {
      const data = await login(email, password);
      if (data?.accountStatus === "pending_deletion" || data?.canCancelDeletion) {
        setPendingDeletion(true);
        return;
      }
      router.replace("/projects");
    } catch (err: any) {
      if (err?.code === "ACCOUNT_SUSPENDED") {
        setError("This account is suspended. Your work is not deleted and returns in full if the account is reactivated. Please contact the platform team.");
      } else {
        setError(formatError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const cancelDeletion = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api<any>("/auth/cancel-deletion", { auth: false, body: { email, password } });
      if (data?.accessToken) setTokens(data.accessToken, data.refreshToken);
      await refresh();
      router.replace("/projects");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-wrap">
      <div className="auth-brand">
        <span className="brand-mark">S</span>
        <span>
          <span className="brand-name">ScriptForge</span>
          <br />
          <span className="brand-sub">Faceless script studio</span>
        </span>
      </div>
      <h1>Log in</h1>
      <form onSubmit={submit} className="card">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <ErrorBox error={error} />
        {pendingDeletion && (
          <div className="banner">
            This account is scheduled for deletion (30-day grace period). You can cancel the deletion
            and keep everything.
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn small" onClick={cancelDeletion} disabled={busy}>
                Cancel deletion &amp; log in
              </button>
            </div>
          </div>
        )}
        <button className="btn" style={{ marginTop: 14, width: "100%" }} disabled={busy}>
          Log in
        </button>
        <p className="small muted">
          <Link href="/forgot-password">Forgot password?</Link> · New here?{" "}
          <Link href="/signup">Create an account</Link>
        </p>
      </form>
    </main>
  );
}

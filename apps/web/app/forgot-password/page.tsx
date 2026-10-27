"use client";

import { useState } from "react";
import Link from "next/link";
import { api, formatError } from "../../lib/api";
import { ErrorBox } from "../../components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<any>("/auth/forgot-password", { auth: false, body: { email } });
      setDone(
        `If an account exists for that email, a reset link is on its way (status: ${r?.emailStatus ?? "sent"}). The link is single-use and expires in 1 hour.`,
      );
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
      <h1>Forgot password</h1>
      <form onSubmit={submit} className="card">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <ErrorBox error={error} />
        {done && <div className="banner info">{done}</div>}
        <button className="btn" style={{ marginTop: 14, width: "100%" }} disabled={busy}>
          Send reset link
        </button>
        <p className="small muted">
          <Link href="/login">Back to login</Link>
        </p>
      </form>
    </main>
  );
}

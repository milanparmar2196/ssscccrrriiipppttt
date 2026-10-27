"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, formatError } from "../../lib/api";
import { ErrorBox } from "../../components/ui";
import PasswordField from "../../components/PasswordField";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<any>("/auth/reset-password", {
        auth: false,
        body: { token, newPassword: password },
      });
      if (r?.breachCheck === "unavailable") {
        setNotice("The breached-password check was unavailable; your password was accepted on strength rules alone.");
      }
      setDone(true);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="card">
        <p>This page needs the token from your password-reset email.</p>
        <Link href="/forgot-password">Request a new reset link</Link>
      </div>
    );
  }
  if (done) {
    return (
      <div className="card">
        <h2>Password updated</h2>
        {notice && <div className="banner info">{notice}</div>}
        <p>All other sessions were signed out. Log in with your new password.</p>
        <button className="btn" onClick={() => router.replace("/login")}>
          Go to login
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="card">
      <PasswordField label="New password" value={password} onChange={setPassword} />
      <ErrorBox error={error} />
      <button className="btn" style={{ marginTop: 14, width: "100%" }} disabled={busy}>
        Reset password
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
      <h1>Reset password</h1>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}

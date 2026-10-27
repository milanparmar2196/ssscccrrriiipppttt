"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formatError, setTokens } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ErrorBox } from "../../components/ui";
import PasswordField from "../../components/PasswordField";

export default function SignupPage() {
  const { refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api<any>("/auth/signup", {
        auth: false,
        body: { email, password, displayName: displayName || undefined },
      });
      if (data?.accessToken) setTokens(data.accessToken, data.refreshToken);
      if (data?.breachCheck === "unavailable") {
        setNotice("Note: the breached-password check was unavailable, so your password was accepted on strength rules alone.");
      }
      await refresh();
      router.replace("/onboarding");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: 440 }}>
      <h1>Create your account</h1>
      <form onSubmit={submit} className="card">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Display name (optional)</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <PasswordField value={password} onChange={setPassword} />
        <ErrorBox error={error} />
        {notice && <div className="banner info">{notice}</div>}
        <button className="btn" style={{ marginTop: 14, width: "100%" }} disabled={busy}>
          Sign up
        </button>
        <p className="small muted">
          We will email you a verification link. You can browse and set up projects right away;
          generation jobs unlock once your email is verified. Already have an account?{" "}
          <Link href="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}

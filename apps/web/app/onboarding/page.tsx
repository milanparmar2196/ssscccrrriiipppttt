"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formatError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ErrorBox, useLoad } from "../../components/ui";

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const yt = useLoad(() => api<any>("/me/youtube"), [user?.id]);

  const duplicateSample = async () => {
    setBusy("sample");
    setError("");
    try {
      const p = await api<any>("/projects/sample/duplicate", { body: {} });
      router.push(`/projects/${p.id ?? p.project?.id}`);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy("");
    }
  };

  const connectYoutube = async () => {
    setBusy("yt");
    setError("");
    try {
      const r = await api<any>("/me/youtube/connect", { body: {} });
      const url = r?.authUrl ?? r?.url;
      if (url) window.location.href = url;
      else setError("YouTube connect did not return an authorisation URL.");
    } catch (e: any) {
      // A failed/cancelled connect never blocks onboarding.
      setError(`${formatError(e)} — you can retry, or connect later in Settings. Onboarding is not blocked.`);
    } finally {
      setBusy("");
    }
  };

  const ytStatus = yt.data?.status ?? yt.data?.connection?.status;

  return (
    <main className="container" style={{ maxWidth: 760 }}>
      <h1>Welcome{user?.displayName ? `, ${user.displayName}` : ""}</h1>
      <p className="muted">
        A <strong>project</strong> is one faceless channel/workspace: its niche, audience strategy,
        configuration and Production Bible are set up once, then every video is produced as a{" "}
        <strong>run</strong> through the pipeline — topics, research, outline, script, scenes, audit,
        package, performance.
      </p>
      <ErrorBox error={error} />

      <div className="card step-card">
        <h3>1 · Explore the sample project</h3>
        <p className="muted small">
          A complete, clearly-labelled SAMPLE journey — topic, research brief, Bible, scenes, audit
          report and final package. It is read-only and costs no credits. Use “Duplicate as my project”
          in the project list when you want your own editable copy.
        </p>
        <div className="row">
          <Link className="btn secondary" href="/projects">
            Browse projects (incl. Sample)
          </Link>
          <button className="btn" onClick={duplicateSample} disabled={busy === "sample"}>
            {busy === "sample" ? "Copying…" : "Duplicate sample as my project"}
          </button>
        </div>
      </div>

      <div className="card step-card">
        <h3>2 · Connect YouTube (optional)</h3>
        <p className="muted small">
          Connecting your channel lets Step 15 sync performance metrics (views, retention, engagement)
          for your published videos. It requests <strong>read-only access only</strong>. Skip is always
          available — the whole workflow works without it (metrics can be entered manually or by CSV),
          and you can connect later in Settings.
        </p>
        {ytStatus && ytStatus !== "disconnected" ? (
          <p>
            Status: <span className="badge ok">{ytStatus}</span>{" "}
            {yt.data?.channelTitle && <span className="muted">({yt.data.channelTitle})</span>}
          </p>
        ) : (
          <div className="row">
            <button className="btn" onClick={connectYoutube} disabled={busy === "yt"}>
              Connect YouTube
            </button>
            <span className="small muted">or just skip this step</span>
          </div>
        )}
      </div>

      <div className="card step-card">
        <h3>3 · Create your first project</h3>
        <p className="muted small">
          The wizard walks the master order: niche → sub-niches → audience &amp; channel strategy →
          configuration questions → Production Bible approval.
        </p>
        <Link className="btn" href="/projects/new">
          Create your first project
        </Link>
      </div>
    </main>
  );
}

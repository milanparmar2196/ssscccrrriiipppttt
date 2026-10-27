"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formatError } from "../../lib/api";
import { Empty, ErrorBox, Loading, useLoad } from "../../components/ui";

export default function ProjectsPage() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState("");
  const { data, loading, reload } = useLoad(
    () => api<any[]>(`/projects${showArchived ? "?archived=1" : ""}`),
    [showArchived],
  );

  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(formatError(e));
    }
  };

  const duplicateSample = async (id: string) => {
    await act(async () => {
      const p = await api<any>("/projects/sample/duplicate", { body: {} });
      router.push(`/projects/${p.id ?? p.project?.id ?? id}`);
    });
  };

  const projects = data ?? [];
  const live = projects.filter((p) => p.lifecycleStatus !== "pending_deletion");
  const deleted = projects.filter((p) => p.lifecycleStatus === "pending_deletion");

  return (
    <main className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Projects</h1>
        <Link className="btn" href="/projects/new">
          New project
        </Link>
      </div>
      <ErrorBox error={error} />
      <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        <input
          type="checkbox"
          style={{ width: "auto" }}
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        Show archived
      </label>
      {loading && <Loading />}
      {!loading && live.length === 0 && (
        <Empty>
          No projects yet. A project holds your channel's niche, strategy, configuration and Production
          Bible; every video is a run inside it.{" "}
          <Link href="/projects/new">Create your first project</Link> or explore the sample project
          below.
        </Empty>
      )}
      <div className="grid cols2">
        {live.map((p) => (
          <div key={p.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{p.name}</strong>
              <span className="row">
                {p.isSample && <span className="badge warn">SAMPLE</span>}
                <span className="badge">{p.type}</span>
                {p.lifecycleStatus === "archived" && <span className="badge">archived</span>}
              </span>
            </div>
            <p className="small muted">
              {p.platform} · Bible: {p.bibleStatus ?? p.data?.bibleStatus ?? "not started"}
            </p>
            <div className="row">
              <Link className="btn small" href={`/projects/${p.id}`}>
                Open
              </Link>
              {p.isSample ? (
                <button className="btn secondary small" onClick={() => duplicateSample(p.id)}>
                  Duplicate as my project
                </button>
              ) : p.lifecycleStatus === "archived" ? (
                <button className="btn secondary small" onClick={() => act(() => api(`/projects/${p.id}/restore`, { body: {} }))}>
                  Unarchive
                </button>
              ) : (
                <button className="btn ghost small" onClick={() => act(() => api(`/projects/${p.id}/archive`, { body: {} }))}>
                  Archive
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {deleted.length > 0 && (
        <>
          <h3>Recently deleted (30-day restore window)</h3>
          <div className="grid cols2">
            {deleted.map((p) => (
              <div key={p.id} className="card">
                <strong>{p.name}</strong>
                <p className="small muted">
                  Scheduled for permanent deletion
                  {p.deletionPurgeAt ? ` on ${new Date(p.deletionPurgeAt).toLocaleDateString()}` : ""}.
                  Exports you already downloaded are your own copies and are unaffected.
                </p>
                <button className="btn secondary small" onClick={() => act(() => api(`/projects/${p.id}/restore`, { body: {} }))}>
                  Restore
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

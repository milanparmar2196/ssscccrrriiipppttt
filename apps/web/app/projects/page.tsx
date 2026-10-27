"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formatError } from "../../lib/api";
import { Empty, ErrorBox, Loading, useLoad } from "../../components/ui";

const GRADS = ["g0", "g1", "g2", "g3"];

function initialsOf(name: string) {
  const parts = (name ?? "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

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
  const active = live.filter((p) => p.lifecycleStatus !== "archived" && !p.isSample);
  const personal = live.filter((p) => p.type === "personal").length;
  const brand = live.filter((p) => p.type === "brand").length;
  const biblesReady = live.filter((p) =>
    String(p.bibleStatus ?? p.data?.bibleStatus ?? "").toLowerCase().includes("approv"),
  ).length;

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <p className="sub">Each project holds a channel's niche, strategy and Production Bible.</p>
        </div>
        <Link className="btn" href="/projects/new">
          + New project
        </Link>
      </div>
      <ErrorBox error={error} />

      <div className="stat-row">
        <div className="stat">
          <div className="k">Active projects</div>
          <div className="v">{active.length}</div>
          <div className="d">{personal} personal · {brand} brand</div>
        </div>
        <div className="stat">
          <div className="k">Bibles approved</div>
          <div className="v">{biblesReady}</div>
          <div className="d">of {live.length} projects</div>
        </div>
        <div className="stat">
          <div className="k">Total projects</div>
          <div className="v">{live.length}</div>
          <div className="d">including the sample project</div>
        </div>
      </div>

      <label className="switch" style={{ marginBottom: 16 }}>
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
        {live.map((p, i) => {
          const bible = p.bibleStatus ?? p.data?.bibleStatus ?? "not started";
          const bibleOk = String(bible).toLowerCase().includes("approv");
          return (
            <div key={p.id} className={`card project-card ${GRADS[i % GRADS.length]}`}>
              <div className="pc-top">
                <span className="pc-tile">{initialsOf(p.name)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                    <span className="pc-name">{p.name}</span>
                    <span className="row" style={{ gap: 6 }}>
                      {p.isSample && <span className="badge warn">SAMPLE</span>}
                      <span className={`badge${p.type === "brand" ? " brand" : ""}`}>{p.type}</span>
                      {p.lifecycleStatus === "archived" && <span className="badge">archived</span>}
                    </span>
                  </div>
                  <div className="pc-meta">
                    <span>{p.platform}</span>
                    <span aria-hidden>·</span>
                    <span className={`dot${bibleOk ? " ok" : " warn"}`} />
                    <span>Bible: {bible}</span>
                  </div>
                </div>
              </div>
              <div className="pc-actions">
                <Link className="btn small" href={`/projects/${p.id}`}>
                  Open project
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
          );
        })}
      </div>

      {deleted.length > 0 && (
        <>
          <h3 style={{ marginTop: 28 }}>Recently deleted (30-day restore window)</h3>
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

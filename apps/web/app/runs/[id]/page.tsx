"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RUN_STAGES } from "@scriptwriter/shared";
import { api, formatError } from "../../../lib/api";
import { ErrorBox, Loading, Modal, useLoad } from "../../../components/ui";
import { ConfigPanel, OutlinePanel, ResearchPanel, ScriptPanel, TopicsPanel } from "../../../components/run-panels-1";
import {
  AssetsPanel, AuditPanel, BrandApprovalPanel, IssuesPanel, PackagePanel, PerformancePanel,
  PublishingPanel, ScenesPanel,
} from "../../../components/run-panels-2";

const STAGE_LABELS: Record<string, string> = {
  topics: "4–5 · Topics & Selection",
  config: "6 · Configuration (+ 8 Bible)",
  research: "7 · Research & Fact Verification",
  outline: "9 · Outline",
  script: "10 · Script Drafting",
  scenes: "11 · Scene Breakdown",
  audit: "12–13 · Audit & Final Approval",
  package: "14 · Production Package",
  performance: "15 · Performance Feedback",
  assets: "16 · Visual & Asset Research (opt.)",
  publishing: "17 · Publishing Optimization (opt.)",
};

export default function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const runRes = useLoad(() => api<any>(`/runs/${id}`), [id]);
  const projectRes = useLoad(
    () => (runRes.data?.projectId ? api<any>(`/projects/${runRes.data.projectId}`) : Promise.resolve(null)),
    [runRes.data?.projectId],
  );
  const [stage, setStage] = useState<string>("topics");
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const router = useRouter();

  const run = runRes.data;
  const stageMap: Record<string, string> = run?.stageMap ?? {};
  const isBrand = projectRes.data?.type === "brand";
  const archived = run?.lifecycleStatus === "archived";
  const deleted = run?.lifecycleStatus === "pending_deletion";

  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await runRes.reload();
    } catch (e) {
      setError(formatError(e));
    }
  };

  if (runRes.loading) return <main className="container"><Loading /></main>;
  if (!run) return <main className="container"><ErrorBox error={runRes.error || "Run not found"} /></main>;

  return (
    <main className="container">
      <p className="small muted">
        <Link href={`/projects/${run.projectId}`}>← Project</Link>
      </p>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: "4px 0" }}>{run.title}</h1>
        <span className="row">
          {archived && <span className="badge">archived — read-only</span>}
          {deleted && <span className="badge bad">recently deleted — restorable for 30 days</span>}
        </span>
      </div>
      <ErrorBox error={error} />
      {run.angleId && (
        <p className="small muted">
          Angle: {run.angleTitle ?? run.angleId}
          {run.angleCompleteness === "title_only" && <span className="badge warn"> Title only</span>} ·
          Story question: {run.storyQuestion ?? "—"}
        </p>
      )}
      {!run.angleId && run.storyQuestion && (
        <p className="small muted">No angle — story question only: {run.storyQuestion}</p>
      )}

      <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
        <div>
          <div className="stepper">
            {RUN_STAGES.map((s) => {
              const status = stageMap[s] ?? "locked";
              return (
                <button
                  key={s}
                  className={stage === s ? "active" : ""}
                  disabled={status === "locked"}
                  title={status === "locked" ? "Locked — complete the previous stage's gate first" : status}
                  onClick={() => setStage(s)}
                >
                  {STAGE_LABELS[s] ?? s}
                  <div className="small muted">
                    {status}
                    {status === "locked" && run.stageLockReasons?.[s] ? ` — ${run.stageLockReasons[s]}` : ""}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="card" style={{ marginTop: 12, maxWidth: 260 }}>
            <h4 style={{ marginTop: 0 }}>Run admin</h4>
            <label>Title</label>
            <input defaultValue={run.title} onChange={(e) => setTitle(e.target.value)} />
            <label>Notes</label>
            <textarea defaultValue={run.notes ?? run.data?.notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
            <button
              className="btn secondary small"
              onClick={() => act(() => api(`/runs/${id}`, { method: "PATCH", body: { title: title || run.title, notes } }))}
            >
              Save
            </button>
            <div className="row" style={{ marginTop: 10 }}>
              {archived || deleted ? (
                <button className="btn small" onClick={() => act(() => api(`/runs/${id}/restore`, { body: {} }))}>
                  Restore
                </button>
              ) : (
                <button className="btn ghost small" onClick={() => act(() => api(`/runs/${id}/archive`, { body: {} }))}>
                  Archive
                </button>
              )}
              {!deleted && (
                <button className="btn danger small" onClick={() => setDeleteOpen(true)}>
                  Delete…
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {stage === "topics" && <TopicsPanel runId={id} />}
          {stage === "config" && <ConfigPanel runId={id} run={run} />}
          {stage === "research" && <ResearchPanel runId={id} run={run} />}
          {stage === "outline" && <OutlinePanel runId={id} />}
          {stage === "script" && <ScriptPanel runId={id} />}
          {stage === "scenes" && <ScenesPanel runId={id} />}
          {stage === "audit" && <AuditPanel runId={id} />}
          {stage === "package" && <PackagePanel runId={id} />}
          {stage === "performance" && <PerformancePanel runId={id} />}
          {stage === "assets" && <AssetsPanel runId={id} />}
          {stage === "publishing" && <PublishingPanel runId={id} />}
          <div style={{ marginTop: 14 }}>
            <IssuesPanel runId={id} />
          </div>
          {isBrand && (
            <div style={{ marginTop: 14 }}>
              <BrandApprovalPanel runId={id} run={run} />
            </div>
          )}
        </div>
      </div>

      {deleteOpen && (
        <Modal title="Delete run" onClose={() => setDeleteOpen(false)}>
          <p>
            This removes the run <strong>{run.title}</strong> and its topics, research, script, scenes,
            audit and package files. It stays restorable for <strong>30 days</strong>, then it is purged.
            Do-Not-Repeat entries created from this run remain, marked “deleted run”.
          </p>
          <label>Type the run title to confirm</label>
          <input value={confirmTitle} onChange={(e) => setConfirmTitle(e.target.value)} />
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="btn danger"
              disabled={confirmTitle !== run.title}
              onClick={() =>
                act(async () => {
                  await api(`/runs/${id}`, { method: "DELETE", body: { confirmTitle } });
                  router.push(`/projects/${run.projectId}?tab=runs`);
                })
              }
            >
              Delete run
            </button>
            <button className="btn secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

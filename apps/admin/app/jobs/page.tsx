"use client";

import { useState } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { ErrorBox, Loading, StatusBadge } from "../../components/ui";

const STATUSES = ["", "queued", "running", "completed", "succeeded", "failed", "cancelled"];

export default function JobsPage() {
  const [status, setStatus] = useState("");
  const { data, error, loading, reload } = useLoad<Obj[]>(
    () => api<Obj[]>(`/admin/jobs${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    [status],
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const cancel = async (job: Obj) => {
    const id = String(job.id);
    if (!window.confirm(`Cancel job ${id}? Queued jobs release their credit hold in full; running jobs stop at the next unit boundary and are charged per completed unit (partials kept).`)) return;
    setBusyId(id);
    setActionError(null);
    setActionOk(null);
    try {
      const res = await api<Obj>(`/admin/jobs/${encodeURIComponent(id)}/cancel`, { method: "POST" });
      setActionOk(`Job ${id} is now ${String(res.status)}.`);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main>
      <h1>Jobs</h1>
      <p className="subtle">
        Generation job oversight (most recent 100). Support actions: cancel a stuck job here; retrying happens from the
        run in the user app with the original parameters. Admins cannot approve a step on behalf of a user, skip an
        audit, or mark an unresolved issue as verified.
      </p>
      <div className="row" style={{ margin: "14px 0" }}>
        <label className="field" style={{ margin: 0 }}>
          <span>Status filter</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "All" : s}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary" onClick={reload}>Refresh</button>
      </div>
      <ErrorBox error={error ?? actionError} />
      {actionOk && <div className="ok-box">{actionOk}</div>}
      {loading ? (
        <Loading />
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Action</th>
                <th>Status</th>
                <th>User</th>
                <th>Run</th>
                <th>Credits</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((j) => (
                <tr key={String(j.id)}>
                  <td>
                    <code>{String(j.id).slice(0, 12)}…</code>
                  </td>
                  <td>
                    <code>{String(j.action)}</code>
                  </td>
                  <td>
                    <StatusBadge status={j.status} />
                  </td>
                  <td>
                    <small>{String(j.userId ?? "—")}</small>
                  </td>
                  <td>
                    <small>{String(j.runId ?? "—")}</small>
                  </td>
                  <td>{String(j.creditsCharged ?? 0)}</td>
                  <td>
                    <small>{String(j.createdAt ?? "")}</small>
                  </td>
                  <td>
                    {(j.status === "queued" || j.status === "running") && (
                      <button className="danger small" disabled={busyId === String(j.id)} onClick={() => void cancel(j)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#667085" }}>
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

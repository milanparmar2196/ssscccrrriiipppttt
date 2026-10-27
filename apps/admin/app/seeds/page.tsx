"use client";

import { useState } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/ui";

function ReportView({ report }: { report: Obj }) {
  const counts = (report.counts as Obj | undefined) ?? {};
  const conflicts = (report.conflicts as Obj[] | undefined) ?? [];
  const errors = (report.errors as string[] | undefined) ?? [];
  const warnings = (report.warnings as string[] | undefined) ?? [];
  return (
    <div>
      <p>
        <strong>{String(report.seedKey)}</strong> · version {String(report.seedVersion ?? "—")} · status{" "}
        {String(report.status ?? "—")}
      </p>
      <p className="subtle">
        {Object.entries(counts).map(([k, v]) => `${k}: ${String(v)}`).join(" · ") || "No counts."}
      </p>
      {conflicts.length > 0 && (
        <div className="warn-box">
          <strong>{conflicts.length} conflict(s)</strong> — locally modified records are kept (local wins) and
          reported, never silently overwritten:
          <ul>
            {conflicts.map((c, i) => (
              <li key={i}>
                <code>{String(c.recordKey)}</code> — {String(c.reason)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {errors.length > 0 && (
        <div className="error-box">
          <strong>Errors:</strong>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="warn-box">
          <strong>Warnings:</strong>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <details>
        <summary>Full report JSON</summary>
        <pre className="json">{JSON.stringify(report, null, 2)}</pre>
      </details>
    </div>
  );
}

export default function SeedsPage() {
  const { data, error, loading, reload } = useLoad<Obj[]>(() => api<Obj[]>("/admin/seeds"));
  const [report, setReport] = useState<Obj | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [importId, setImportId] = useState("");

  const total = (data ?? []).reduce((n, s) => n + Number(s.importedRecords ?? 0), 0);

  const runImport = async (seedKey: string) => {
    setBusyKey(seedKey);
    setActionError(null);
    try {
      const res = await api<Obj>(`/admin/seeds/${encodeURIComponent(seedKey)}/import`, { method: "POST" });
      setReport(res);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyKey(null);
    }
  };

  const fetchImport = async () => {
    setActionError(null);
    try {
      const res = await api<Obj>(`/admin/seeds/imports/${encodeURIComponent(importId)}`);
      setReport(res);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main>
      <h1>Seed Data</h1>
      <p className="subtle">
        Versioned seed files imported with stable-ID upserts. Local modifications surface as <strong>conflicts</strong>{" "}
        (local wins, reported) and tombstones are respected — imports never silently overwrite admin edits. Total
        imported records: <strong>{total.toLocaleString()}</strong> across {(data ?? []).length} seed files.
      </p>
      <ErrorBox error={error ?? actionError} />
      {loading ? (
        <Loading />
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Seed key</th>
                <th>File</th>
                <th>Imported records</th>
                <th>Last import</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((s) => {
                const last = s.lastImport as Obj | null;
                return (
                  <tr key={String(s.seedKey)}>
                    <td>
                      <code>{String(s.seedKey)}</code>
                    </td>
                    <td>
                      <small>{String(s.file ?? "")}</small>
                    </td>
                    <td>{String(s.importedRecords ?? 0)}</td>
                    <td>
                      {last ? (
                        <small>
                          v{String(last.seedVersion ?? "?")} · {String(last.status ?? "")} · conflicts{" "}
                          {String(((last.conflicts as unknown[]) ?? []).length)} · errors{" "}
                          {String(((last.errors as unknown[]) ?? []).length)} · warnings{" "}
                          {String(((last.warnings as unknown[]) ?? []).length)}
                          <br />
                          <button className="secondary small" onClick={() => setReport(last)}>
                            View report
                          </button>
                        </small>
                      ) : (
                        <small>never imported</small>
                      )}
                    </td>
                    <td>
                      <button
                        className="small"
                        disabled={busyKey !== null}
                        onClick={() => void runImport(String(s.seedKey))}
                      >
                        {busyKey === String(s.seedKey) ? "Importing…" : "Import"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Fetch an import report by ID</h3>
        <div className="row">
          <label className="field grow" style={{ margin: 0 }}>
            <span>Import ID</span>
            <input value={importId} onChange={(e) => setImportId(e.target.value)} />
          </label>
          <button className="secondary" disabled={!importId} onClick={() => void fetchImport()}>
            Fetch report
          </button>
        </div>
      </div>

      {report && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Import report</h3>
          <ReportView report={report} />
        </div>
      )}
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { Badge, DataTable, ErrorBox, Loading } from "../../components/ui";
import JsonEditor from "../../components/JsonEditor";

function providerOf(a: Obj): string {
  return String(a.providerId ?? a.providerKey ?? "");
}

export default function ModelProvidersPage() {
  const providers = useLoad<Obj[]>(() => api<Obj[]>("/admin/model-providers"));
  const assignments = useLoad<Obj[]>(() => api<Obj[]>("/admin/model-assignments"));
  const thresholds = useLoad<Obj>(() => api<Obj>("/admin/similarity-thresholds"));

  const [selected, setSelected] = useState<Obj | null>(null);
  const [creating, setCreating] = useState(false);
  const [assignmentRows, setAssignmentRows] = useState<Obj[] | null>(null);
  const [thresholdDraft, setThresholdDraft] = useState<Obj | null>(null);
  const [reindexScope, setReindexScope] = useState("all");
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      await fn();
      setActionOk(okMsg);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const rows = assignmentRows ?? assignments.data ?? [];
  const auditRow = rows.find((r) => r.stage === "audit" || r.stage === "audit_run");
  const draftRow = rows.find((r) => r.stage === "script_drafting" || r.stage === "script_generate");
  const auditConflict = useMemo(() => {
    if (!auditRow || !draftRow) return false;
    return providerOf(auditRow) !== "" && providerOf(auditRow) === providerOf(draftRow) && String(auditRow.modelId ?? "") === String(draftRow.modelId ?? "");
  }, [auditRow, draftRow]);

  const modelsOf = (p: Obj): Obj[] => (Array.isArray(p.models) ? (p.models as Obj[]) : []);

  return (
    <main>
      <h1>Model Providers</h1>
      <p className="subtle">
        Provider registry and per-stage model assignment. <strong>API keys live only in the server <code>.env</code></strong>{" "}
        (named per provider, e.g. <code>OPENAI_API_KEY</code>) — they are never shown or entered here; this page shows
        masked configuration status only.
      </p>
      <ErrorBox error={actionError} />
      {actionOk && <div className="ok-box">{actionOk}</div>}

      <h2>Providers & model catalogues</h2>
      <ErrorBox error={providers.error} />
      {providers.loading ? (
        <Loading />
      ) : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <button onClick={() => { setCreating(true); setSelected(null); }}>New provider</button>
            <button className="secondary" onClick={providers.reload}>Refresh</button>
          </div>
          <DataTable
            rows={(providers.data ?? []).map((p) => ({
              ...p,
              modelCount: modelsOf(p).length,
              testResult: testResults[String(p.key)] ?? "",
            }))}
            columns={["key", "name", "envKeyName", "modelCount", "status", "testResult"]}
            onRowClick={(row) => { setSelected(row); setCreating(false); }}
            emptyText="No providers loaded."
          />
          {(providers.data ?? []).map((p) => (
            <div key={String(p.key)} style={{ marginTop: 8 }}>
              <button
                className="secondary small"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const res = await api<Obj>(`/admin/model-providers/${encodeURIComponent(String(p.key))}/test`, {
                      method: "POST",
                    });
                    setTestResults((prev) => ({
                      ...prev,
                      [String(p.key)]: res.keyConfigured ? "Key configured" : "Key NOT configured",
                    }));
                  }, `Tested ${String(p.key)}.`)
                }
              >
                Test connection — {String(p.key)}
              </button>{" "}
              <small>Reports whether the provider key is present in the server .env (keyConfigured).</small>
              {modelsOf(p).length > 0 && (
                <details style={{ marginTop: 6 }}>
                  <summary>
                    Models for {String(p.key)} ({modelsOf(p).length})
                  </summary>
                  <DataTable
                    rows={modelsOf(p)}
                    columns={["modelId", "displayName", "modelType", "costTier", "status"]}
                    emptyText="No models in this provider record."
                  />
                </details>
              )}
            </div>
          ))}
          {selected && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Edit provider {String(selected.key)}</h3>
              <JsonEditor
                value={selected}
                keyField="key"
                saving={busy}
                onSave={(record) =>
                  run(async () => {
                    await api(`/admin/model-providers/${encodeURIComponent(String(selected.key))}`, {
                      method: "PATCH",
                      body: record,
                    });
                    setSelected(null);
                    providers.reload();
                  }, "Provider saved.")
                }
              />
              <div style={{ marginTop: 12 }}>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Archive provider ${String(selected.key)}?`)) return;
                    void run(async () => {
                      await api(`/admin/model-providers/${encodeURIComponent(String(selected.key))}`, { method: "DELETE" });
                      setSelected(null);
                      providers.reload();
                    }, "Provider archived.");
                  }}
                >
                  Archive provider
                </button>{" "}
                <button className="secondary" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          )}
          {creating && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>New provider</h3>
              <JsonEditor
                value={{ key: "", name: "", envKeyName: "", baseUrl: "", models: [], status: "active" }}
                keyField="key"
                saving={busy}
                saveLabel="Create provider"
                onSave={(record) =>
                  run(async () => {
                    await api("/admin/model-providers", { method: "POST", body: record });
                    setCreating(false);
                    providers.reload();
                  }, "Provider created.")
                }
              />
              <div style={{ marginTop: 12 }}>
                <button className="secondary" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      <h2>Stage assignments</h2>
      <p className="subtle">
        Each pipeline stage is assigned a provider + model with an ordered fallback chain. Runs snapshot the models
        actually used (Generator Profile).
      </p>
      {auditConflict && (
        <div className="error-box">
          <strong>⚠ Audit independence warning:</strong> the <code>audit</code> stage is assigned the same provider +
          model as <code>script_drafting</code> ({providerOf(auditRow!)} / {String(auditRow!.modelId)}). The model that
          drafts should not be the model that audits its own output — assign a different model to the audit stage.
        </div>
      )}
      <ErrorBox error={assignments.error} />
      {assignments.loading ? (
        <Loading />
      ) : (
        <div className="panel">
          {rows.map((row, i) => (
            <div key={String(row.stage ?? i)} style={{ borderBottom: "1px solid #eceef2", padding: "10px 0" }}>
              <div className="row">
                <label className="field" style={{ margin: 0 }}>
                  <span>Stage</span>
                  <input value={String(row.stage ?? "")} disabled style={{ width: 190 }} />
                </label>
                <label className="field grow" style={{ margin: 0 }}>
                  <span>Provider</span>
                  <input
                    value={providerOf(row)}
                    onChange={(e) => {
                      const next = rows.map((r, j) => (j === i ? { ...r, providerId: e.target.value, providerKey: e.target.value } : r));
                      setAssignmentRows(next);
                    }}
                  />
                </label>
                <label className="field grow" style={{ margin: 0 }}>
                  <span>Model</span>
                  <input
                    value={String(row.modelId ?? "")}
                    onChange={(e) => {
                      const next = rows.map((r, j) => (j === i ? { ...r, modelId: e.target.value } : r));
                      setAssignmentRows(next);
                    }}
                  />
                </label>
                {(row.stage === "audit" || row.stage === "audit_run") && <Badge tone="blue">audit stage</Badge>}
              </div>
              <label className="field">
                <span>Fallback chain (JSON array of {"{ providerId, modelId }"})</span>
                <textarea
                  rows={2}
                  value={JSON.stringify(row.fallbackChain ?? [])}
                  onChange={(e) => {
                    try {
                      const parsed: unknown = JSON.parse(e.target.value);
                      const next = rows.map((r, j) => (j === i ? { ...r, fallbackChain: parsed } : r));
                      setAssignmentRows(next);
                    } catch {
                      /* keep typing; invalid JSON simply doesn't update the row */
                    }
                  }}
                />
              </label>
              <label className="field">
                <span>Params (JSON)</span>
                <textarea
                  rows={1}
                  value={JSON.stringify(row.params ?? {})}
                  onChange={(e) => {
                    try {
                      const parsed: unknown = JSON.parse(e.target.value);
                      const next = rows.map((r, j) => (j === i ? { ...r, params: parsed } : r));
                      setAssignmentRows(next);
                    } catch {
                      /* ignore while typing */
                    }
                  }}
                />
              </label>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api("/admin/model-assignments", { method: "PUT", body: { assignments: rows } });
                  setAssignmentRows(null);
                  assignments.reload();
                }, "Stage assignments saved.")
              }
            >
              Save all assignments
            </button>
          </div>
        </div>
      )}

      <div className="grid2">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Similarity thresholds</h3>
          <p className="subtle">
            Separate thresholds for topic dedupe, Do-Not-Repeat matching and originality. Defaults stay provisional
            until calibrated on representative Hindi/English pairs.
          </p>
          <ErrorBox error={thresholds.error} />
          {thresholds.loading ? (
            <Loading />
          ) : (
            <>
              {(["topicDedupe", "doNotRepeat", "originality"] as const).map((k) => {
                const draft = thresholdDraft ?? thresholds.data ?? {};
                return (
                  <label className="field" key={k}>
                    <span>{k}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={String(draft[k] ?? "")}
                      onChange={(e) => setThresholdDraft({ ...(thresholdDraft ?? thresholds.data ?? {}), [k]: Number(e.target.value) })}
                    />
                  </label>
                );
              })}
              <button
                disabled={busy || !thresholdDraft}
                onClick={() =>
                  void run(async () => {
                    await api("/admin/similarity-thresholds", { method: "PUT", body: thresholdDraft });
                    setThresholdDraft(null);
                    thresholds.reload();
                  }, "Thresholds saved.")
                }
              >
                Save thresholds
              </button>
            </>
          )}
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Embeddings re-index</h3>
          <p className="subtle">
            Changing the embedding model requires re-indexing stored vectors. Scope: <code>all</code>, a project ID, or
            an entity type. While a provider is out, monitoring shows <code>semanticStatus: unavailable</code> — never a
            silent pass.
          </p>
          <label className="field">
            <span>Scope</span>
            <input value={reindexScope} onChange={(e) => setReindexScope(e.target.value)} />
          </label>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const res = await api<Obj>("/admin/embeddings/reindex", {
                  method: "POST",
                  body: { scope: reindexScope },
                });
                setActionOk(`Re-index queued: request ${String(res.requestId)} (status ${String(res.status)}).`);
              }, "Re-index requested.")
            }
          >
            Queue re-index
          </button>
        </div>
      </div>
    </main>
  );
}

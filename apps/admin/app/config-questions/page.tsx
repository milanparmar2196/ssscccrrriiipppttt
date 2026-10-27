"use client";

import { useState, type FormEvent } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { DataTable, ErrorBox, Loading } from "../../components/ui";
import JsonEditor from "../../components/JsonEditor";

export default function ConfigQuestionsPage() {
  const { data, error, loading, reload } = useLoad<Obj[]>(() => api<Obj[]>("/admin/config-questions"));
  const [selected, setSelected] = useState<Obj | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Niche assignment form
  const [nicheId, setNicheId] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [mode, setMode] = useState("assign");
  const [overrides, setOverrides] = useState("{}");
  const [assignmentId, setAssignmentId] = useState("");

  const rows = (data ?? []).filter((r) =>
    search ? JSON.stringify(r).toLowerCase().includes(search.toLowerCase()) : true,
  );

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setSaving(true);
    setActionError(null);
    setActionOk(null);
    try {
      await fn();
      setActionOk(okMsg);
      setSelected(null);
      setCreating(false);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const publish = (row: Obj) => {
    const key = String(row.key ?? row.id ?? "");
    void run(
      () => api(`/admin/config-questions/${encodeURIComponent(key)}/publish`, { method: "POST" }),
      `Question ${key} published (status active, version bumped).`,
    );
  };

  const submitAssignment = async (e: FormEvent) => {
    e.preventDefault();
    let parsedOverrides: Obj = {};
    try {
      parsedOverrides = JSON.parse(overrides) as Obj;
    } catch {
      setActionError("Overrides must be valid JSON.");
      return;
    }
    await run(async () => {
      const res = await api<Obj>(`/admin/niches/${encodeURIComponent(nicheId)}/questions`, {
        method: "POST",
        body: { questionId, mode, overrides: parsedOverrides },
      });
      setAssignmentId(String(res.assignmentId ?? ""));
    }, `Question ${mode === "clone" ? "cloned into" : "assigned to"} niche ${nicheId}.`);
  };

  return (
    <main>
      <h1>Configuration Questions</h1>
      <p className="subtle">
        The dynamic question builder: Layer A (project) + Layer B (run) seed questions merged with niche question
        packs. Questions are data — adding or activating one here makes it appear in the Website configuration flow
        with no code change. Choice questions allow custom answers by default.
      </p>
      <div className="row" style={{ margin: "14px 0" }}>
        <label className="field grow" style={{ margin: 0 }}>
          <span>Search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by key, label, pack…" />
        </label>
        <button onClick={() => { setCreating(true); setSelected(null); }}>New question</button>
        <button className="secondary" onClick={reload}>Refresh</button>
      </div>
      <ErrorBox error={error ?? actionError} />
      {actionOk && <div className="ok-box">{actionOk}</div>}
      {loading ? (
        <Loading />
      ) : (
        <>
          <DataTable
            rows={rows}
            columns={["key", "label", "scope", "type", "required", "status", "packKey", "legacyId"]}
            onRowClick={(row) => { setSelected(row); setCreating(false); }}
            emptyText="No questions loaded."
          />
          {selected && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Edit question {String(selected.key ?? selected.id ?? "")}</h3>
              <JsonEditor
                value={selected}
                keyField="key"
                saving={saving}
                onSave={(record) =>
                  run(
                    () =>
                      api(`/admin/config-questions/records/${encodeURIComponent(String(selected.key ?? selected.id))}`, {
                        method: "PATCH",
                        body: record,
                      }),
                    "Question saved as a new version.",
                  )
                }
              />
              <div style={{ marginTop: 12 }}>
                <button onClick={() => publish(selected)} disabled={saving}>
                  Publish (activate)
                </button>{" "}
                <button
                  className="danger"
                  disabled={saving}
                  onClick={() => {
                    const key = String(selected.key ?? selected.id ?? "");
                    if (!window.confirm(`Archive question ${key}?`)) return;
                    void run(
                      () => api(`/admin/config-questions/records/${encodeURIComponent(key)}`, { method: "DELETE" }),
                      "Question archived.",
                    );
                  }}
                >
                  Archive
                </button>{" "}
                <button className="secondary" onClick={() => setSelected(null)}>Close</button>
              </div>
              <p className="subtle">
                Publish applies to questions stored as admin records; a seed-only question must be saved once (creating
                its record) before it can be published.
              </p>
            </div>
          )}
          {creating && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>New question</h3>
              <JsonEditor
                value={{
                  key: "",
                  label: "",
                  scope: "global",
                  type: "single_choice",
                  options: [],
                  allowCustomAnswer: true,
                  required: false,
                  order: 0,
                  status: "draft",
                }}
                keyField="key"
                saving={saving}
                saveLabel="Create question"
                onSave={(record) =>
                  run(() => api("/admin/config-questions/records", { method: "POST", body: record }), "Question created.")
                }
              />
              <div style={{ marginTop: 12 }}>
                <button className="secondary" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Niche question assignments</h3>
        <p className="subtle">
          Questions live once in the library and are reused per niche. <strong>Assign</strong> links the library question
          (per-niche overrides: order, required, defaultValue, grouping). <strong>Clone</strong> makes an independent
          niche-specific copy. The resolved flow list is Global + Niche + Sub-Niche, computed by the API.
        </p>
        <form onSubmit={submitAssignment}>
          <div className="row">
            <label className="field grow" style={{ margin: 0 }}>
              <span>Niche ID</span>
              <input value={nicheId} onChange={(e) => setNicheId(e.target.value)} required placeholder="e.g. 123" />
            </label>
            <label className="field grow" style={{ margin: 0 }}>
              <span>Question key / ID</span>
              <input value={questionId} onChange={(e) => setQuestionId(e.target.value)} required placeholder="e.g. audience_age" />
            </label>
            <label className="field" style={{ margin: 0 }}>
              <span>Mode</span>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="assign">assign</option>
                <option value="clone">clone</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Overrides (JSON)</span>
            <textarea rows={3} value={overrides} onChange={(e) => setOverrides(e.target.value)} spellCheck={false} />
          </label>
          <button type="submit" disabled={saving}>
            {mode === "clone" ? "Clone into niche" : "Assign to niche"}
          </button>
        </form>
        <h3>Remove an assignment</h3>
        <div className="row">
          <label className="field grow" style={{ margin: 0 }}>
            <span>Assignment ID (nicheId:questionId)</span>
            <input value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} placeholder="123:audience_age" />
          </label>
          <button
            className="danger"
            disabled={saving || !nicheId || !assignmentId}
            onClick={() => {
              if (!window.confirm(`Remove assignment ${assignmentId} from niche ${nicheId}?`)) return;
              void run(
                () =>
                  api(`/admin/niches/${encodeURIComponent(nicheId)}/questions/${encodeURIComponent(assignmentId)}`, {
                    method: "DELETE",
                  }),
                "Assignment removed.",
              );
            }}
          >
            Remove assignment
          </button>
        </div>
      </div>
    </main>
  );
}

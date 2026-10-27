"use client";

import { useState } from "react";
import { api, useLoad, type Obj } from "../lib/api";
import { DataTable, Empty, ErrorBox, Loading } from "./ui";
import JsonEditor from "./JsonEditor";

/**
 * Generic Admin library CRUD page (API library pattern):
 * GET list (seeds merged with admin records), POST create,
 * PATCH /:key, DELETE /:key (archive — never a hard delete).
 */
export default function RecordLibrary({
  title,
  description,
  basePath,
  keyField = "key",
  columns,
  newTemplate = {},
  note,
}: {
  title: string;
  description?: string;
  basePath: string;
  keyField?: string;
  columns: string[];
  newTemplate?: Obj;
  note?: string;
}) {
  const { data, error, loading, reload } = useLoad<Obj[]>(() => api<Obj[]>(basePath));
  const [selected, setSelected] = useState<Obj | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

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

  const archive = (row: Obj) => {
    const key = String(row[keyField] ?? row.id ?? row.key ?? "");
    if (!key) return;
    if (!window.confirm(`Archive record "${key}"? Archiving removes it from the merged library view; it is not a hard delete.`)) return;
    void run(() => api(`${basePath}/${encodeURIComponent(key)}`, { method: "DELETE" }), `Archived ${key}.`);
  };

  return (
    <main>
      <h1>{title}</h1>
      {description && <p className="subtle">{description}</p>}
      {note && <div className="warn-box">{note}</div>}
      <div className="row" style={{ margin: "14px 0" }}>
        <label className="field grow" style={{ margin: 0 }}>
          <span>Search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter loaded records…" />
        </label>
        <button onClick={() => { setCreating(true); setSelected(null); }}>New record</button>
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
            columns={columns}
            onRowClick={(row) => { setSelected(row); setCreating(false); }}
            emptyText="No records yet. Create the first one."
          />
          {selected && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>
                Edit {String(selected[keyField] ?? selected.id ?? selected.key ?? "record")}
              </h3>
              <JsonEditor
                value={selected}
                keyField={keyField}
                saving={saving}
                onSave={(record) =>
                  run(
                    () =>
                      api(`${basePath}/${encodeURIComponent(String(selected[keyField] ?? selected.id ?? selected.key))}`, {
                        method: "PATCH",
                        body: record,
                      }),
                    "Record saved (new version)."
                  )
                }
              />
              <div style={{ marginTop: 12 }}>
                <button className="danger" onClick={() => archive(selected)} disabled={saving}>
                  Archive record
                </button>{" "}
                <button className="secondary" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          )}
          {creating && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>New record</h3>
              <JsonEditor
                value={{ [keyField]: "", status: "active", ...newTemplate }}
                keyField={keyField}
                saving={saving}
                saveLabel="Create record"
                onSave={(record) => run(() => api(basePath, { method: "POST", body: record }), "Record created.")}
              />
              <div style={{ marginTop: 12 }}>
                <button className="secondary" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          )}
          {!selected && !creating && rows.length > 0 && (
            <p className="subtle" style={{ marginTop: 10 }}>Click a row to edit it. Delete archives the record.</p>
          )}
          {rows.length === 0 && !creating && <Empty>No records match.</Empty>}
        </>
      )}
    </main>
  );
}

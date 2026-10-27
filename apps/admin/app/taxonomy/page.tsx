"use client";

import { useState } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { DataTable, ErrorBox, Loading } from "../../components/ui";
import JsonEditor from "../../components/JsonEditor";

type Tab = "categories" | "niches" | "subs";

const COLUMNS: Record<Tab, string[]> = {
  categories: ["id", "categoryKey", "name", "entityFocus"],
  niches: ["id", "legacyId", "name", "categoryKey"],
  subs: ["id", "legacyId", "name"],
};

const LABELS: Record<Tab, string> = {
  categories: "Categories",
  niches: "Niches",
  subs: "Sub-niches",
};

export default function TaxonomyPage() {
  const { data, error, loading, reload } = useLoad<Obj>(() => api<Obj>("/admin/taxonomy"));
  const [tab, setTab] = useState<Tab>("categories");
  const [selected, setSelected] = useState<Obj | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rows = ((data?.[tab] as Obj[] | undefined) ?? []).filter((r) =>
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

  return (
    <main>
      <h1>Taxonomy</h1>
      <p className="subtle">
        Fully dynamic — no caps on categories, niches or sub-niches. Category <code>categoryKey</code> values are stable
        and never change (renaming the display name is fine); all mappings reference the key. Records are edited through{" "}
        <code>/admin/taxonomy/records</code>; delete archives.
      </p>
      <div className="tabs">
        {(Object.keys(LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : undefined}
            onClick={() => {
              setTab(t);
              setSelected(null);
              setCreating(false);
            }}
          >
            {LABELS[t]} ({((data?.[t] as Obj[] | undefined) ?? []).length})
          </button>
        ))}
      </div>
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
            columns={COLUMNS[tab]}
            onRowClick={(row) => { setSelected(row); setCreating(false); }}
            emptyText={`No ${LABELS[tab].toLowerCase()} loaded.`}
          />
          {selected && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Edit record {String(selected.id ?? "")}</h3>
              <JsonEditor
                value={selected}
                keyField="id"
                saving={saving}
                onSave={(record) =>
                  run(
                    () => api(`/admin/taxonomy/records/${encodeURIComponent(String(selected.id))}`, { method: "PATCH", body: record }),
                    "Taxonomy record saved.",
                  )
                }
              />
              <div style={{ marginTop: 12 }}>
                <button
                  className="danger"
                  disabled={saving}
                  onClick={() => {
                    if (!window.confirm(`Archive taxonomy record ${String(selected.id)}?`)) return;
                    void run(
                      () => api(`/admin/taxonomy/records/${encodeURIComponent(String(selected.id))}`, { method: "DELETE" }),
                      "Taxonomy record archived.",
                    );
                  }}
                >
                  Archive record
                </button>{" "}
                <button className="secondary" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          )}
          {creating && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>New {LABELS[tab].slice(0, -1).toLowerCase()} record</h3>
              <JsonEditor
                value={{ id: "", name: "", status: "active" }}
                keyField="id"
                saving={saving}
                saveLabel="Create record"
                onSave={(record) =>
                  run(() => api("/admin/taxonomy/records", { method: "POST", body: record }), "Taxonomy record created.")
                }
              />
              <div style={{ marginTop: 12 }}>
                <button className="secondary" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

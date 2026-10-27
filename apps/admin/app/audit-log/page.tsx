"use client";

import { useState } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/ui";

export default function AuditLogPage() {
  const { data, error, loading, reload } = useLoad<Obj[]>(() => api<Obj[]>("/admin/audit-log"));
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = (data ?? []).filter((r) =>
    search ? JSON.stringify(r).toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <main>
      <h1>Admin Audit Log</h1>
      <p className="subtle">
        Every admin action: who (individual AdminUser, or <code>bootstrap</code> for the setup/recovery identity), the
        action, the target and the timestamp. The log is immutable — entries are never edited or deleted from this UI.
        Most recent 100 entries.
      </p>
      <div className="row" style={{ margin: "14px 0" }}>
        <label className="field grow" style={{ margin: 0 }}>
          <span>Filter</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="actor, action, target…" />
        </label>
        <button className="secondary" onClick={reload}>Refresh</button>
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const key = String(r.id ?? i);
                return [
                  <tr key={key}>
                    <td>{String(r.actor ?? "—")}</td>
                    <td>
                      <code>{String(r.action ?? "")}</code>
                    </td>
                    <td>{String(r.target ?? "—")}</td>
                    <td>
                      <small>{String(r.at ?? r.createdAt ?? "")}</small>
                    </td>
                    <td>
                      <button className="secondary small" onClick={() => setExpanded(expanded === key ? null : key)}>
                        {expanded === key ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>,
                  expanded === key ? (
                    <tr key={`${key}-meta`}>
                      <td colSpan={5}>
                        <pre className="json">{JSON.stringify(r, null, 2)}</pre>
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#667085" }}>
                    No audit entries.
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

"use client";

import { useMemo, useState } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { Badge, DataTable, Empty, ErrorBox, Loading } from "../../components/ui";

const FIELD_KEYS = ["question", "scope", "evidence", "boundary"] as const;

export default function AnglesPage() {
  const taxonomy = useLoad<Obj>(() => api<Obj>("/admin/taxonomy"));
  const [targetId, setTargetId] = useState("");
  const angles = useLoad<Obj[]>(
    () => (targetId ? api<Obj[]>(`/admin/niches/${encodeURIComponent(targetId)}/angles`) : Promise.resolve([])),
    [targetId],
  );
  const [selected, setSelected] = useState<Obj | null>(null);
  const [draft, setDraft] = useState<Obj>({});
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const targets = useMemo(() => {
    const niches = (taxonomy.data?.niches as Obj[] | undefined) ?? [];
    const subs = (taxonomy.data?.subs as Obj[] | undefined) ?? [];
    return [
      ...niches.map((n) => ({ id: String(n.id), label: `Niche — ${String(n.name ?? n.id)} (${String(n.id)})` })),
      ...subs.map((s) => ({ id: String(s.id), label: `Sub-niche — ${String(s.name ?? s.id)} (${String(s.id)})` })),
    ];
  }, [taxonomy.data]);

  const rows = (angles.data ?? []).filter((r) =>
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
      angles.reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (row: Obj) => {
    setSelected(row);
    setDraft({ ...row });
    setCreating(false);
  };

  const suggested = (selected?.suggestedFields as Obj | undefined) ?? undefined;

  return (
    <main>
      <h1>Angles</h1>
      <p className="subtle">
        Angles are managed per niche (or sub-niche). An angle used by any run is <strong>archived, never deleted</strong>,
        so run snapshots stay resolvable. Angles seeded from ANGLES_MASTER.md carry titles only and are labelled{" "}
        <strong>Title only</strong> until an admin fills in question, scope, evidence and boundary.
      </p>

      <div className="row" style={{ margin: "14px 0" }}>
        <label className="field grow" style={{ margin: 0 }}>
          <span>Niche / sub-niche</span>
          <select
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value);
              setSelected(null);
            }}
          >
            <option value="">Select a niche…</option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ margin: 0 }}>
          <span>…or type a target ID</span>
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="niche id"
            style={{ width: 160 }}
          />
        </label>
      </div>
      <ErrorBox error={taxonomy.error} />

      {!targetId ? (
        <Empty>Pick a niche or sub-niche to see its angles.</Empty>
      ) : (
        <>
          <div className="row" style={{ margin: "14px 0" }}>
            <label className="field grow" style={{ margin: 0 }}>
              <span>Search angles</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by slug or title…" />
            </label>
            <button
              onClick={() => {
                setCreating(true);
                setSelected(null);
                setDraft({ slug: "", angle: "", question: "", scope: "", evidence: "", boundary: "" });
              }}
            >
              New angle
            </button>
            <button className="secondary" onClick={angles.reload}>Refresh</button>
          </div>
          <ErrorBox error={angles.error ?? actionError} />
          {actionOk && <div className="ok-box">{actionOk}</div>}
          {angles.loading ? (
            <Loading />
          ) : (
            <>
              <p className="subtle">
                {rows.length} angle(s) · {rows.filter((r) => r.completeness === "title_only").length} title-only
              </p>
              <DataTable
                rows={rows.map((r) => ({
                  ...r,
                  completenessLabel: r.completeness === "title_only" ? "Title only" : "Complete",
                }))}
                columns={["slug", "angle", "completenessLabel", "status", "version"]}
                onRowClick={openEditor}
                emptyText="No angles for this target yet."
              />
            </>
          )}

          {(selected || creating) && (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>
                {creating ? "New angle" : `Edit angle ${String(draft.slug ?? "")}`}{" "}
                {!creating && draft.completeness === "title_only" && <Badge tone="amber">Title only</Badge>}
                {!creating && draft.completeness !== "title_only" && <Badge tone="green">Complete</Badge>}
              </h3>

              {suggested && (
                <div className="warn-box">
                  <strong>AI draft suggestions — not guidance.</strong> The fields below were suggested by AI and are
                  stored as drafts (<code>suggestedFields</code>). <strong>Human review is required</strong> before they
                  become guidance: a suggestion only takes effect when you copy it into the real field, check it, and
                  save — saving is recorded as a normal admin edit.
                  <pre className="json">{JSON.stringify(suggested, null, 2)}</pre>
                  <button
                    className="secondary small"
                    onClick={() => {
                      const next = { ...draft };
                      for (const k of FIELD_KEYS) {
                        if (suggested[k] && !next[k]) next[k] = suggested[k];
                      }
                      setDraft(next);
                    }}
                  >
                    Copy suggestions into empty fields (review before saving)
                  </button>
                </div>
              )}

              <label className="field">
                <span>Slug</span>
                <input
                  value={String(draft.slug ?? "")}
                  disabled={!creating}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Angle (title)</span>
                <input value={String(draft.angle ?? "")} onChange={(e) => setDraft({ ...draft, angle: e.target.value })} />
              </label>
              {FIELD_KEYS.map((k) => (
                <label className="field" key={k}>
                  <span>
                    {k}
                    {draft[k] ? "" : " — not set"}
                  </span>
                  <textarea
                    rows={3}
                    value={String(draft[k] ?? "")}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                  />
                </label>
              ))}
              <p className="subtle">
                Filling all four fields (question, scope, evidence, boundary) clears the <strong>Title only</strong>{" "}
                label and marks the angle complete. Runs that select a title-only angle must supply a story question
                before research can start.
              </p>
              <div className="row">
                <button
                  disabled={saving}
                  onClick={() => {
                    if (creating) {
                      void run(
                        () => api(`/admin/niches/${encodeURIComponent(targetId)}/angles`, { method: "POST", body: draft }),
                        "Angle created.",
                      );
                    } else {
                      const angleId = String(draft.id ?? draft.slug);
                      void run(
                        () =>
                          api(`/admin/niches/${encodeURIComponent(targetId)}/angles/${encodeURIComponent(angleId)}`, {
                            method: "PATCH",
                            body: draft,
                          }),
                        "Angle saved (version bumped).",
                      );
                    }
                  }}
                >
                  {saving ? "Saving…" : creating ? "Create angle" : "Save angle"}
                </button>
                {!creating && (
                  <button
                    className="danger"
                    disabled={saving}
                    onClick={() => {
                      const angleId = String(draft.id ?? draft.slug);
                      if (!window.confirm(`Archive angle ${angleId}? Angles are archived, never hard-deleted.`)) return;
                      void run(
                        () =>
                          api(`/admin/niches/${encodeURIComponent(targetId)}/angles/${encodeURIComponent(angleId)}`, {
                            method: "DELETE",
                          }),
                        "Angle archived.",
                      );
                    }}
                  >
                    Archive angle
                  </button>
                )}
                <button className="secondary" onClick={() => { setSelected(null); setCreating(false); }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

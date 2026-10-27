"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BIBLE_MASTER_LIST_KEYS, BIBLE_SECTION_KEYS, REGISTRY_TYPES } from "@scriptwriter/shared";
import { api, formatError } from "../../../lib/api";
import {
  DynamicForm, Empty, ErrorBox, JobButton, Loading, Modal, answersFromApi, jobBody, useLoad,
} from "../../../components/ui";

const SECTION_LABELS: Record<string, string> = {
  channelPromise: "1 · Channel Promise", audiencePersona: "2 · Audience", toneBible: "3 · Tone",
  languageBible: "4 · Language", visualBible: "5 · Visual", structureBible: "6 · Structure",
  packagingBible: "7 · Packaging", complianceBible: "8 · Compliance",
  voiceNarrationBible: "9 · Voice & Narration", glossaryPronunciation: "10 · Glossary & Pronunciation",
  musicSoundBible: "11 · Music & Sound", seriesContinuityBible: "12 · Series & Continuity",
  researchEvidenceStandards: "13 · Research & Evidence Standards",
  performanceLearningsLog: "14 · Performance Learnings Log",
};
const LIST_LABELS: Record<string, string> = {
  sourceList: "Master Source List", doNotRepeat: "Do-Not-Repeat List", masterTimeline: "Master Timeline / Chronology",
  locationSettings: "Master Location / Setting List", hookOpeningLibrary: "Hook & Opening Library",
  phraseBank: "Phrase Bank", assetSourceList: "Approved Asset Source List",
};

const TABS = ["overview", "niches", "bible", "config", "master-lists", "registries", "templates", "exports", "runs"] as const;

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const search = useSearchParams();
  const [tab, setTab] = useState<string>(search.get("tab") ?? "overview");
  const project = useLoad(() => api<any>(`/projects/${id}`), [id]);
  const p = project.data;

  return (
    <main className="container">
      {project.loading && <Loading />}
      <ErrorBox error={project.error} />
      {p && (
        <>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1>
              {p.name} {p.isSample && <span className="badge warn">SAMPLE — read-only content</span>}{" "}
              {p.lifecycleStatus === "archived" && <span className="badge">archived</span>}
            </h1>
            <span className="badge">{p.type}</span>
          </div>
          {p.lifecycleStatus === "archived" && (
            <div className="banner info">
              This project is archived and read-only. Unarchive it from the Overview tab to keep working.
              Archiving never changes credit history.
            </div>
          )}
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                {t.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
          {tab === "overview" && <OverviewTab id={id} project={p} reload={project.reload} />}
          {tab === "niches" && <NichesTab id={id} sample={p.isSample} />}
          {tab === "bible" && <BibleTab id={id} sample={p.isSample} />}
          {tab === "config" && <ConfigTab id={id} />}
          {tab === "master-lists" && <MasterListsTab id={id} />}
          {tab === "registries" && <RegistriesTab id={id} />}
          {tab === "templates" && <TemplatesTab id={id} />}
          {tab === "exports" && <ExportsTab id={id} />}
          {tab === "runs" && <RunsTab id={id} project={p} />}
        </>
      )}
    </main>
  );
}

/* ---------------- Overview ---------------- */

function OverviewTab({ id, project, reload }: { id: string; project: any; reload: () => Promise<void> }) {
  const summary = useLoad(() => api<any>(`/projects/${id}/summary`).catch(() => null), [id]);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const router = useRouter();

  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(formatError(e));
    }
  };

  return (
    <div>
      <ErrorBox error={error} />
      <div className="card">
        <dl className="kv">
          <dt>Name</dt><dd>{project.name}</dd>
          <dt>Type</dt><dd>{project.type}</dd>
          <dt>Platform</dt><dd>{project.platform}</dd>
          <dt>Status</dt><dd>{project.lifecycleStatus}</dd>
          <dt>Bible</dt><dd>{project.bibleStatus ?? project.data?.bibleStatus ?? "—"}</dd>
        </dl>
        <div className="row" style={{ marginTop: 12 }}>
          {project.lifecycleStatus === "archived" ? (
            <button className="btn small" onClick={() => act(() => api(`/projects/${id}/restore`, { body: {} }))}>
              Unarchive
            </button>
          ) : (
            <button className="btn secondary small" onClick={() => act(() => api(`/projects/${id}/archive`, { body: {} }))}>
              Archive
            </button>
          )}
          {!project.isSample && (
            <button className="btn danger small" onClick={() => setDeleteOpen(true)}>
              Delete project…
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <h3>Summary</h3>
        {summary.loading ? <Loading /> : summary.data ? (
          <pre className="json">{JSON.stringify(summary.data, null, 2)}</pre>
        ) : (
          <p className="muted">No summary available yet.</p>
        )}
      </div>
      {deleteOpen && (
        <Modal title="Delete project" onClose={() => setDeleteOpen(false)}>
          <p>
            This removes <strong>{project.name}</strong>: its Bible versions, registries, master lists,
            runs and package files. The project stays restorable for <strong>30 days</strong>, then it
            is purged permanently. Credit/ledger history is retained, and exports you already downloaded
            are your own copies and are unaffected.
          </p>
          <label>Type the project name to confirm</label>
          <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="btn danger"
              disabled={confirmName !== project.name}
              onClick={() =>
                act(async () => {
                  await api(`/projects/${id}`, { method: "DELETE", body: { confirmName } });
                  router.push("/projects");
                })
              }
            >
              Delete project
            </button>
            <button className="btn secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Niches ---------------- */

function NichesTab({ id, sample }: { id: string; sample?: boolean }) {
  const niches = useLoad(() => api<any[]>(`/projects/${id}/niches`), [id]);
  const strategy = useLoad(() => api<any>(`/projects/${id}/audience-strategy`), [id]);
  const [strat, setStrat] = useState<Record<string, any>>({});
  const [subName, setSubName] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (strategy.data) setStrat(strategy.data);
  }, [strategy.data]);

  const saveStrategy = async () => {
    setError("");
    try {
      await api(`/projects/${id}/audience-strategy`, { method: "PUT", body: strat });
      setMsg("Strategy saved.");
    } catch (e) {
      setError(formatError(e));
    }
  };

  return (
    <div>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      <div className="card">
        <h3>Project niches</h3>
        {niches.loading ? <Loading /> : (niches.data ?? []).length === 0 ? (
          <Empty>No niches yet — add them from the project creation wizard flow.</Empty>
        ) : (
          (niches.data ?? []).map((n: any) => (
            <div key={n.id} style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
              <strong>{n.name ?? n.key}</strong>{" "}
              <span className="small muted">{n.categoryKey ?? ""}</span>
              {!sample && (
                <div className="row" style={{ marginTop: 6 }}>
                  <input
                    placeholder="Add a sub-niche name"
                    style={{ maxWidth: 260 }}
                    value={subName[n.id] ?? ""}
                    onChange={(e) => setSubName({ ...subName, [n.id]: e.target.value })}
                  />
                  <button
                    className="btn secondary small"
                    onClick={async () => {
                      setError("");
                      try {
                        await api(`/projects/${id}/niches/${n.key ?? n.id}/sub-niches`, {
                          body: { name: subName[n.id] },
                        });
                        setSubName({ ...subName, [n.id]: "" });
                        setMsg("Sub-niche added.");
                      } catch (e) {
                        setError(formatError(e));
                      }
                    }}
                  >
                    Add sub-niche
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="card">
        <h3>Audience &amp; channel strategy</h3>
        {strategy.loading ? (
          <Loading />
        ) : (
          <>
            {Object.keys(strat).length === 0 && <p className="muted">No strategy saved yet.</p>}
            {Object.entries(strat).map(([k, v]) => (
              <div key={k}>
                <label>{k}</label>
                <input
                  value={typeof v === "string" ? v : JSON.stringify(v)}
                  onChange={(e) => setStrat({ ...strat, [k]: e.target.value })}
                />
              </div>
            ))}
            {!sample && (
              <button className="btn" style={{ marginTop: 12 }} onClick={saveStrategy}>
                Save strategy
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Bible ---------------- */

function BibleTab({ id, sample }: { id: string; sample?: boolean }) {
  const versions = useLoad(() => api<any[]>(`/projects/${id}/bible/versions`), [id]);
  const [selected, setSelected] = useState<number | null>(null);
  const version = useLoad(
    () => (selected ? api<any>(`/projects/${id}/bible/versions/${selected}`) : Promise.resolve(null)),
    [selected],
  );
  const annexes = useLoad(() => api<any[]>(`/projects/${id}/bible/annexes`).catch(() => []), [id]);
  const proposed = useLoad(() => api<any[]>(`/projects/${id}/bible/proposed-edits`).catch(() => []), [id]);
  const [sections, setSections] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const list = versions.data ?? [];
    if (list.length && selected === null) {
      const latest = [...list].sort((a: any, b: any) => (b.version ?? b.versionNo) - (a.version ?? a.versionNo))[0];
      setSelected(latest.version ?? latest.versionNo);
    }
  }, [versions.data, selected]);

  useEffect(() => {
    if (version.data) {
      const s: Record<string, any> = {};
      for (const k of BIBLE_SECTION_KEYS) s[k] = version.data[k] ?? {};
      setSections(s);
    }
  }, [version.data]);

  const isDraft = version.data && version.data.status !== "approved";

  const saveDraft = async () => {
    setError("");
    try {
      await api(`/projects/${id}/bible/versions/${selected}`, { method: "PATCH", body: sections });
      setMsg("Draft saved.");
      await version.reload();
    } catch (e) {
      setError(formatError(e));
    }
  };
  const approve = async () => {
    setError("");
    try {
      await api(`/projects/${id}/bible/versions/${selected}/approve`, { body: {} });
      setMsg("Bible version approved and locked.");
      await versions.reload();
      await version.reload();
    } catch (e) {
      setError(formatError(e));
    }
  };

  return (
    <div>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      <div className="card">
        <div className="row">
          <strong>Versions:</strong>
          {versions.loading ? <Loading /> : (versions.data ?? []).map((v: any) => {
            const no = v.version ?? v.versionNo;
            return (
              <button key={no} className={`btn small ${selected === no ? "" : "secondary"}`} onClick={() => setSelected(no)}>
                v{no} ({v.status})
              </button>
            );
          })}
          {!sample && (
            <JobButton
              label="Generate new draft (job)"
              action="bible_generate"
              estimateParams={{ units: 1 }}
              className="btn secondary small"
              start={(jc) => api(`/projects/${id}/bible/generate`, jobBody(jc))}
              onDone={() => versions.reload()}
            />
          )}
        </div>
        {(versions.data ?? []).length === 0 && (
          <p className="muted">No Bible yet. Generate a draft, review the 14 sections, then approve — a project cannot start a run until a Bible version is approved.</p>
        )}
      </div>

      {version.data && (
        <div className="card">
          <h3>
            Bible v{version.data.version} — {version.data.status}
            {isDraft ? " (draft, editable)" : " (locked)"}
          </h3>
          {BIBLE_SECTION_KEYS.map((key) => (
            <details key={key} style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
              <summary>
                <strong>{SECTION_LABELS[key] ?? key}</strong>
                {key === "performanceLearningsLog" && (
                  <span className="small muted"> — approved learnings only; fills via Step 15, never auto-edited</span>
                )}
              </summary>
              {isDraft && !sample && key !== "performanceLearningsLog" ? (
                <SectionEditor
                  value={sections[key]}
                  onChange={(v) => setSections({ ...sections, [key]: v })}
                />
              ) : (
                <pre className="json">{JSON.stringify(version.data[key] ?? {}, null, 2)}</pre>
              )}
            </details>
          ))}
          {isDraft && !sample && (
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn secondary" onClick={saveDraft}>
                Save draft
              </button>
              <button className="btn" onClick={approve}>
                Approve &amp; lock this version
              </button>
            </div>
          )}
          {version.data.characterSnapshot && (
            <div style={{ marginTop: 14 }}>
              <h4>Character snapshot (frozen in this version)</h4>
              <pre className="json">{JSON.stringify(version.data.characterSnapshot, null, 2)}</pre>
              {version.data.characterDrift && (
                <div className="banner">
                  The living Character Registry has changed since this snapshot. Review the changes in
                  the Registries tab — including them creates a new draft Bible version through the
                  normal approval flow. Locked versions never change in place.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3>Active annexes</h3>
        <p className="small muted">
          Only annexes active for this project's niches exist here. The Character annex holds portrayal
          rules and dialogue policy only — character data itself lives in Registries.
        </p>
        {annexes.loading ? <Loading /> : (annexes.data ?? []).length === 0 ? (
          <p className="muted">No active annexes.</p>
        ) : (
          (annexes.data ?? []).map((a: any, i: number) => (
            <details key={a.key ?? i} style={{ padding: "6px 0" }}>
              <summary>
                <strong>{a.label ?? a.key}</strong> {a.active === false && <span className="badge">inactive</span>}
              </summary>
              <pre className="json">{JSON.stringify(a, null, 2)}</pre>
            </details>
          ))
        )}
      </div>

      <div className="card">
        <h3>Proposed edits inbox</h3>
        <p className="small muted">
          Learnings proposed from Step 15 arrive here as diffs. Approving creates a new Bible version —
          nothing enters the locked Bible without passing this inbox.
        </p>
        {(proposed.data ?? []).filter((e: any) => e.status === "pending").length === 0 && (
          <p className="muted">No pending proposals.</p>
        )}
        {(proposed.data ?? []).map((e: any) => (
          <div key={e.id} style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
            <span className="badge">{e.status}</span> <strong>{e.sectionKey ?? e.target ?? "Bible edit"}</strong>
            <pre className="json">{JSON.stringify(e.diff ?? e.changes ?? e, null, 2)}</pre>
            {e.status === "pending" && !sample && (
              <div className="row">
                <button
                  className="btn small"
                  onClick={async () => {
                    await api(`/projects/${id}/bible/proposed-edits/${e.id}/approve`, { body: {} });
                    await proposed.reload();
                    await versions.reload();
                  }}
                >
                  Approve (new Bible version)
                </button>
                <button
                  className="btn ghost small"
                  onClick={async () => {
                    await api(`/projects/${id}/bible/proposed-edits/${e.id}/reject`, { body: { note: "Rejected from web inbox" } });
                    await proposed.reload();
                  }}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const obj = value && typeof value === "object" ? value : { text: String(value ?? "") };
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return (
      <textarea
        placeholder="Section content (JSON or text)"
        onBlur={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            onChange({ text: e.target.value });
          }
        }}
        defaultValue=""
      />
    );
  }
  return (
    <div>
      {keys.map((k) => (
        <div key={k}>
          <label>{k}</label>
          {typeof obj[k] === "string" ? (
            <textarea value={obj[k]} onChange={(e) => onChange({ ...obj, [k]: e.target.value })} />
          ) : (
            <textarea
              value={JSON.stringify(obj[k], null, 2)}
              onChange={(e) => {
                try {
                  onChange({ ...obj, [k]: JSON.parse(e.target.value) });
                } catch {
                  /* keep typing */
                }
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Config ---------------- */

function ConfigTab({ id }: { id: string }) {
  const niches = useLoad(() => api<any[]>(`/projects/${id}/niches`), [id]);
  const nicheId = niches.data?.[0]?.key ?? niches.data?.[0]?.nicheId ?? niches.data?.[0]?.id;
  const schema = useLoad(
    () => api<any[]>(`/config-schema?projectId=${id}${nicheId ? `&nicheId=${nicheId}` : ""}`),
    [id, nicheId],
  );
  const current = useLoad(() => api<any>(`/projects/${id}/configuration`), [id]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (current.data) setAnswers(answersFromApi(current.data));
  }, [current.data]);

  return (
    <div className="card">
      <p className="muted small">
        Project configuration defaults, rendered from the API schema for this project's niche.
        Runs inherit these and may override per run.
      </p>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      {schema.loading ? <Loading /> : <DynamicForm questions={schema.data ?? []} answers={answers} onChange={setAnswers} />}
      <button
        className="btn"
        style={{ marginTop: 12 }}
        onClick={async () => {
          setError("");
          try {
            await api(`/projects/${id}/config-answers`, { body: { answers } });
            setMsg("Configuration saved.");
          } catch (e) {
            setError(formatError(e));
          }
        }}
      >
        Save configuration
      </button>
    </div>
  );
}

/* ---------------- Master lists & registries (generic CRUD) ---------------- */

function GenericCrud({
  title,
  load,
  create,
  update,
  remove,
  sample,
}: {
  title: string;
  load: () => Promise<any[]>;
  create: (data: any) => Promise<any>;
  update: (entryId: string, data: any) => Promise<any>;
  remove: (entryId: string) => Promise<any>;
  sample?: boolean;
}) {
  const list = useLoad(load, []);
  const [draft, setDraft] = useState("{}");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const parse = () => {
    try {
      return JSON.parse(draft);
    } catch {
      throw new Error("Entry must be valid JSON.");
    }
  };
  const wrap = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      setDraft("{}");
      setEditing(null);
      await list.reload();
    } catch (e) {
      setError(formatError(e));
    }
  };

  return (
    <div className="card">
      <h3>{title}</h3>
      <ErrorBox error={error} />
      {list.loading ? <Loading /> : (list.data ?? []).length === 0 ? (
        <p className="muted">No entries yet.</p>
      ) : (
        (list.data ?? []).map((e: any) => (
          <div key={e.id} style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
            <strong>{e.title ?? e.name ?? e.label ?? e.key ?? e.id}</strong>
            <pre className="json">{JSON.stringify(e.data ?? e, null, 2)}</pre>
            {!sample && (
              <div className="row">
                <button
                  className="btn ghost small"
                  onClick={() => {
                    setEditing(e.id);
                    setDraft(JSON.stringify(e.data ?? e, null, 2));
                  }}
                >
                  Edit
                </button>
                <button className="btn ghost small" onClick={() => wrap(() => remove(e.id))}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}
      {!sample && (
        <div style={{ marginTop: 12 }}>
          <label>{editing ? "Edit entry (JSON)" : "New entry (JSON)"}</label>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} style={{ minHeight: 110, fontFamily: "monospace" }} />
          <div className="row" style={{ marginTop: 8 }}>
            {editing ? (
              <>
                <button className="btn small" onClick={() => wrap(() => update(editing, parse()))}>
                  Save entry
                </button>
                <button className="btn secondary small" onClick={() => setEditing(null)}>
                  Cancel edit
                </button>
              </>
            ) : (
              <button className="btn small" onClick={() => wrap(() => create(parse()))}>
                Add entry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MasterListsTab({ id }: { id: string }) {
  const [key, setKey] = useState<string>(BIBLE_MASTER_LIST_KEYS[0]);
  return (
    <div>
      <div className="tabs">
        {BIBLE_MASTER_LIST_KEYS.map((k) => (
          <button key={k} className={key === k ? "active" : ""} onClick={() => setKey(k)}>
            {LIST_LABELS[k] ?? k}
          </button>
        ))}
      </div>
      {key === "doNotRepeat" && (
        <p className="small muted">
          Mostly auto-filled when a Production Package completes; you can remove wrong entries or add
          manual ones.
        </p>
      )}
      <GenericCrud
        key={key}
        title={LIST_LABELS[key] ?? key}
        load={() => api<any[]>(`/projects/${id}/master-lists/${key}`)}
        create={(data) => api(`/projects/${id}/master-lists/${key}`, { body: data })}
        update={(entryId, data) => api(`/projects/${id}/master-lists/${key}/${entryId}`, { method: "PATCH", body: data })}
        remove={(entryId) => api(`/projects/${id}/master-lists/${key}/${entryId}`, { method: "DELETE" })}
      />
    </div>
  );
}

function RegistriesTab({ id }: { id: string }) {
  const [type, setType] = useState("");
  const list = useLoad(
    () => api<any[]>(`/projects/${id}/registries${type ? `?type=${type}` : ""}`),
    [id, type],
  );
  return (
    <div>
      <div className="card">
        <p className="muted small">
          Registries hold the living entities (characters, places, knowledge…). The Character Registry
          is the canonical home for character data — locked appearance descriptions here are appended
          to AI image prompts for visual consistency. Only registry modules active for this project's
          niches apply.
        </p>
        <label>Filter by registry type</label>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ maxWidth: 280 }}>
          <option value="">All types</option>
          {REGISTRY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <GenericCrud
        key={type}
        title="Registry entries"
        load={async () => list.data ?? (await api<any[]>(`/projects/${id}/registries${type ? `?type=${type}` : ""}`))}
        create={(data) => api(`/projects/${id}/registries`, { body: data })}
        update={(entryId, data) => api(`/projects/${id}/registries/${entryId}`, { method: "PATCH", body: data })}
        remove={(entryId) => api(`/projects/${id}/registries/${entryId}`, { method: "DELETE" })}
      />
    </div>
  );
}

/* ---------------- Templates ---------------- */

function TemplatesTab({ id }: { id: string }) {
  const templates = useLoad(() => api<any[]>("/niche-templates").catch(() => []), []);
  const status = useLoad(() => api<any>(`/projects/${id}/template-status`).catch(() => null), [id]);
  const [selected, setSelected] = useState("");
  const [saveName, setSaveName] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  return (
    <div>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      {status.data?.updateAvailable && (
        <div className="banner">
          A newer version of the applied template exists. Nothing auto-updates — review the diff and
          apply explicitly.
          <pre className="json">{JSON.stringify(status.data.diff ?? status.data, null, 2)}</pre>
        </div>
      )}
      <div className="card">
        <h3>Apply a niche template</h3>
        <p className="small muted">
          A template is a snapshot pre-fill (strategy, configuration, Bible, questions, research,
          structures, scenes, audit add-ons, packaging, registries). Everything stays editable.
        </p>
        <div className="row">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ maxWidth: 340 }}>
            <option value="">— choose template —</option>
            {(templates.data ?? []).map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.isDefault ? "(default)" : ""}
              </option>
            ))}
          </select>
          <button
            className="btn small"
            disabled={!selected}
            onClick={async () => {
              setError("");
              try {
                await api(`/projects/${id}/apply-template`, { body: { templateId: selected } });
                setMsg("Template applied as a snapshot.");
                await status.reload();
              } catch (e) {
                setError(formatError(e));
              }
            }}
          >
            Apply template
          </button>
        </div>
        {selected && (
          <TemplatePreview templateId={selected} />
        )}
      </div>
      <div className="card">
        <h3>Save this setup as a template</h3>
        <div className="row">
          <input placeholder="Template name" style={{ maxWidth: 300 }} value={saveName} onChange={(e) => setSaveName(e.target.value)} />
          <button
            className="btn secondary small"
            disabled={!saveName.trim()}
            onClick={async () => {
              setError("");
              try {
                await api(`/projects/${id}/save-as-template`, { body: { name: saveName, scope: "personal" } });
                setMsg("Saved to My Templates.");
                await templates.reload();
              } catch (e) {
                setError(formatError(e));
              }
            }}
          >
            Save as template
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ templateId }: { templateId: string }) {
  const t = useLoad(() => api<any>(`/niche-templates/${templateId}`).catch(() => null), [templateId]);
  if (t.loading) return <Loading />;
  if (!t.data) return null;
  const sections = t.data.sections ?? t.data;
  return (
    <details style={{ marginTop: 10 }}>
      <summary>Preview template sections</summary>
      <pre className="json">{JSON.stringify(sections, null, 2)}</pre>
    </details>
  );
}

/* ---------------- Exports ---------------- */

function ExportsTab({ id }: { id: string }) {
  const [exportId, setExportId] = useState<string | null>(null);
  const exp = useLoad(
    () => (exportId ? api<any>(`/projects/${id}/exports/${exportId}`) : Promise.resolve(null)),
    [exportId],
  );
  return (
    <div className="card">
      <h3>Export my data (this project)</h3>
      <p className="small muted">
        Request an export job; when ready, download it via the signed link. States: pending → ready →
        expired, or failed (retry by requesting again).
      </p>
      <JobButton
        label="Request project export (job)"
        action="export_generate"
        estimateParams={{ units: 1 }}
        start={(jc) => api(`/projects/${id}/export`, jobBody(jc))}
        onDone={(result) => {
          const eid = result?.exportId ?? result?.id;
          if (eid) setExportId(eid);
        }}
      />
      {exportId && (
        <div style={{ marginTop: 12 }}>
          {exp.loading ? <Loading /> : exp.data ? (
            <>
              <p>
                Export state: <span className="badge">{exp.data.status ?? exp.data.state ?? "pending"}</span>
              </p>
              {(exp.data.downloadUrl ?? exp.data.signedUrl) && (
                <a className="btn small" href={exp.data.downloadUrl ?? exp.data.signedUrl}>
                  Download export
                </a>
              )}
              <pre className="json">{JSON.stringify(exp.data, null, 2)}</pre>
            </>
          ) : (
            <p className="muted">Export is being prepared — check back shortly.</p>
          )}
          <button className="btn ghost small" onClick={() => exp.reload()}>
            Refresh status
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Runs ---------------- */

function RunsTab({ id, project }: { id: string; project: any }) {
  const runs = useLoad(() => api<any[]>(`/projects/${id}/runs`), [id]);
  const niches = useLoad(() => api<any[]>(`/projects/${id}/niches`), [id]);
  const [title, setTitle] = useState("");
  const [nicheId, setNicheId] = useState("");
  const [angleId, setAngleId] = useState("");
  const [storyQuestion, setStoryQuestion] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const nicheKey = nicheId || niches.data?.[0]?.key || niches.data?.[0]?.id || "";
  const angles = useLoad(
    () => (nicheKey ? api<any[]>(`/niches/${nicheKey}/angles`).catch(() => []) : Promise.resolve([])),
    [nicheKey],
  );
  const selectedAngle = (angles.data ?? []).find((a: any) => String(a.id) === String(angleId));
  const titleOnly = selectedAngle?.completeness === "title_only";

  const create = async () => {
    setError("");
    try {
      const run = await api<any>(`/projects/${id}/runs`, {
        body: {
          title,
          ...(nicheKey ? { nicheId: nicheKey } : {}),
          ...(angleId ? { angleId } : {}),
          ...(storyQuestion ? { storyQuestion } : {}),
        },
      });
      router.push(`/runs/${run.id}`);
    } catch (e) {
      setError(formatError(e));
    }
  };

  return (
    <div>
      <ErrorBox error={error} />
      <div className="grid cols2">
        {(runs.data ?? []).map((r: any) => (
          <div key={r.id} className="card">
            <strong>{r.title}</strong>
            <p className="small muted">
              Stage: {r.currentStage ?? "—"} · {r.lifecycleStatus ?? "active"}
            </p>
            <Link className="btn small" href={`/runs/${r.id}`}>
              Open run
            </Link>
          </div>
        ))}
      </div>
      {(runs.data ?? []).length === 0 && !runs.loading && (
        <Empty>No runs yet. Create the first run below — one run = one video.</Empty>
      )}
      {!project.isSample && (
        <div className="card">
          <h3>New run</h3>
          <label>Run title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Fall of Constantinople" />
          <label>Niche</label>
          <select value={nicheKey} onChange={(e) => { setNicheId(e.target.value); setAngleId(""); }}>
            {(niches.data ?? []).map((n: any) => (
              <option key={n.id} value={n.key ?? n.id}>
                {n.name ?? n.key}
              </option>
            ))}
          </select>
          <label>Angle (optional)</label>
          <select value={angleId} onChange={(e) => setAngleId(e.target.value)}>
            <option value="">— no angle (question only) —</option>
            {(angles.data ?? []).map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.title ?? a.name} {a.completeness === "title_only" ? "— Title only" : ""}
              </option>
            ))}
          </select>
          {selectedAngle && (
            <div className="small" style={{ marginTop: 6 }}>
              {titleOnly ? (
                <span className="badge warn">{selectedAngle.titleOnlyLabel ?? "Title only"}</span>
              ) : (
                <>
                  {selectedAngle.question && <p><strong>Question framing:</strong> {selectedAngle.question}</p>}
                  {selectedAngle.scope && <p><strong>Scope:</strong> {JSON.stringify(selectedAngle.scope)}</p>}
                  {selectedAngle.boundary && <p><strong>Boundary:</strong> {String(selectedAngle.boundary)}</p>}
                </>
              )}
              {titleOnly && (
                <p className="muted">
                  This angle has a title only — its question/scope are not written yet, so the story
                  question below is required and nothing is assumed. It becomes the run's research
                  boundary note.
                </p>
              )}
            </div>
          )}
          {(angles.data ?? []).length === 0 && (
            <p className="small muted">
              This niche has no angles yet (angles are created in Admin — Angle Registry on the niche).
              The run will be created with the story question alone and Research will show “no angle
              scope — question only”.
            </p>
          )}
          <label>Story question {titleOnly || !angleId ? "(required)" : ""}</label>
          <input
            value={storyQuestion}
            onChange={(e) => setStoryQuestion(e.target.value)}
            placeholder={selectedAngle?.question ?? "The concrete question this video answers"}
          />
          <button className="btn" style={{ marginTop: 12 }} onClick={create} disabled={!title.trim()}>
            Create run
          </button>
        </div>
      )}
    </div>
  );
}

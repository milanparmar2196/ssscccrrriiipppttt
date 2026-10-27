"use client";

import { useEffect, useState } from "react";
import { ApiError, api, formatError } from "../lib/api";
import {
  DynamicForm, Empty, ErrorBox, JobButton, Loading, Modal, answersFromApi, jobBody, useLoad,
} from "./ui";

/* ---------------- Topics (Steps 4–5) ---------------- */

export function TopicsPanel({ runId }: { runId: string }) {
  const topics = useLoad(() => api<any[]>(`/runs/${runId}/topics`), [runId]);
  const [count, setCount] = useState(10);
  const [manual, setManual] = useState({ title: "", angle: "" });
  const [error, setError] = useState("");
  const [dupWarning, setDupWarning] = useState<any>(null);
  const [scoreEdits, setScoreEdits] = useState<Record<string, Record<string, number>>>({});

  const addManual = async (confirmDuplicate = false) => {
    setError("");
    setDupWarning(null);
    try {
      await api(`/runs/${runId}/topics`, {
        body: { ...manual, ...(confirmDuplicate ? { confirmDuplicate: true } : {}) },
      });
      setManual({ title: "", angle: "" });
      await topics.reload();
    } catch (e) {
      if (e instanceof ApiError && e.code === "POSSIBLE_DUPLICATE") {
        setDupWarning(e.details);
      } else {
        setError(formatError(e));
      }
    }
  };

  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await topics.reload();
    } catch (e) {
      setError(formatError(e));
    }
  };

  return (
    <div>
      <ErrorBox error={error} />
      <div className="card">
        <div className="row">
          <label style={{ margin: 0 }}>Count</label>
          <input type="number" style={{ width: 90 }} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          <JobButton
            label="Generate topics (job)"
            action="topic_generate"
            estimateParams={{ units: count }}
            start={(jc) => api(`/runs/${runId}/topics/generate`, jobBody(jc, { count }))}
            onDone={() => topics.reload()}
          />
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <input placeholder="Manual topic title" style={{ flex: 2 }} value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} />
          <input placeholder="Angle / hook" style={{ flex: 1 }} value={manual.angle} onChange={(e) => setManual({ ...manual, angle: e.target.value })} />
          <button className="btn secondary" onClick={() => addManual(false)} disabled={!manual.title.trim()}>
            Add manually
          </button>
        </div>
        {dupWarning && (
          <div className="banner" style={{ marginTop: 12 }}>
            <strong>Possible duplicate.</strong>{" "}
            {dupWarning.semanticStatus && (
              <>Semantic check: {dupWarning.semanticStatus === "unavailable" || dupWarning.semanticStatus === "keyword_only"
                ? "Semantic check not completed — keyword matches only."
                : dupWarning.semanticStatus}{" "}
              </>
            )}
            A match is an indicator, not a rejection — intentionally related topics can continue, and
            the acknowledgement is recorded.
            <pre className="json">{JSON.stringify(dupWarning.matches ?? dupWarning, null, 2)}</pre>
            <button className="btn small" onClick={() => addManual(true)}>
              Create anyway (recorded)
            </button>
          </div>
        )}
      </div>

      {topics.loading ? <Loading /> : (topics.data ?? []).length === 0 ? (
        <Empty>No topics yet. Generate some or add one manually — at least 1 topic is needed to proceed.</Empty>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Topic</th><th>Status</th><th>Scores (1–10)</th><th>Total</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(topics.data ?? []).map((t: any) => {
                const scores = { ...(t.scores ?? {}), ...(scoreEdits[t.id] ?? {}) };
                const total = Object.values(scores).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                return (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.title}</strong>
                      {t.angle && <div className="small muted">{t.angle}</div>}
                    </td>
                    <td><span className="badge">{t.status}</span></td>
                    <td>
                      {["audienceInterest", "originality", "storytellingPotential", "researchFeasibility", "relevance", "productionRequirements", "visualFeasibility"].map((k) => (
                        <label key={k} style={{ display: "inline-block", margin: "0 8px 0 0" }}>
                          <span className="small muted">{k}</span>
                          <input
                            type="number" min={1} max={10} style={{ width: 56 }}
                            value={scores[k] ?? ""}
                            onChange={(e) =>
                              setScoreEdits({ ...scoreEdits, [t.id]: { ...(scoreEdits[t.id] ?? {}), [k]: Number(e.target.value) } })
                            }
                          />
                        </label>
                      ))}
                    </td>
                    <td>{total || "—"}</td>
                    <td>
                      <div className="row">
                        <JobButton
                          label="Evaluate"
                          action="topic_evaluate"
                          estimateParams={{ units: 1 }}
                          className="btn ghost small"
                          start={(jc) => api(`/runs/${runId}/topics/${t.id}/evaluate`, jobBody(jc))}
                          onDone={() => topics.reload()}
                        />
                        <button
                          className="btn ghost small"
                          onClick={() => act(() => api(`/runs/${runId}/topics/${t.id}/scores`, { method: "PATCH", body: { scores } }))}
                        >
                          Save scores
                        </button>
                        <button
                          className="btn small"
                          onClick={() => {
                            if (window.confirm(`Select “${t.title}” as this run's topic? This is an approval action.`)) {
                              void act(() => api(`/runs/${runId}/topics/${t.id}/select`, { body: {} }));
                            }
                          }}
                        >
                          Select topic
                        </button>
                        <button
                          className="btn ghost small"
                          onClick={() => act(() => api(`/runs/${runId}/topics/${t.id}`, { method: "DELETE" }))}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Config (Step 6) + Bible confirm (Step 8 gate) ---------------- */

export function ConfigPanel({ runId, run }: { runId: string; run: any }) {
  const schema = useLoad(
    () => api<any[]>(`/config-schema?stepKey=run${run?.nicheId ? `&nicheId=${run.nicheId}` : ""}`),
    [runId, run?.nicheId],
  );
  const current = useLoad(() => api<any>(`/runs/${runId}/config-answers`), [runId]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [bibleDecision, setBibleDecision] = useState<"confirm" | "">("");

  useEffect(() => {
    if (current.data) setAnswers(answersFromApi(current.data));
  }, [current.data]);

  return (
    <div>
      <div className="card">
        <p className="muted small">
          Run-level configuration — defaults are pre-filled from the project; overrides apply to this
          run only. Required fields must be complete to proceed.
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
              await api(`/runs/${runId}/config-answers`, { body: { answers } });
              setMsg("Run configuration saved.");
            } catch (e) {
              setError(formatError(e));
            }
          }}
        >
          Save run configuration
        </button>
      </div>
      <div className="card">
        <h3>Production Bible for this run (Step 8)</h3>
        <p className="small muted">
          The run is locked to a Bible version. If the project Bible has changed since, confirm the
          version this run will use — this gate completes only via an explicit confirmation.
        </p>
        <pre className="json">{JSON.stringify(run?.bibleSnapshot ?? run?.bible ?? {}, null, 2)}</pre>
        <div className="row">
          <select value={bibleDecision} onChange={(e) => setBibleDecision(e.target.value as any)} style={{ maxWidth: 240 }}>
            <option value="">— choose —</option>
            <option value="confirm">Confirm locked Bible version</option>
          </select>
          <button
            className="btn secondary"
            disabled={!bibleDecision}
            onClick={async () => {
              setError("");
              try {
                await api(`/runs/${runId}/bible/confirm`, { body: { decision: bibleDecision } });
                setMsg("Bible version confirmed for this run.");
              } catch (e) {
                setError(formatError(e));
              }
            }}
          >
            Confirm Bible
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Research (Step 7) ---------------- */

const MODES = ["curated_first", "curated_only", "web_only", "selected_only"];

export function ResearchPanel({ runId, run }: { runId: string; run: any }) {
  const brief = useLoad(() => api<any>(`/runs/${runId}/research`).catch(() => null), [runId]);
  const gaps = useLoad(() => api<any>(`/runs/${runId}/research/gaps`).catch(() => null), [runId]);
  const sources = useLoad(() => api<any[]>(`/runs/${runId}/research/sources`).catch(() => []), [runId]);
  const claims = useLoad(() => api<any[]>(`/runs/${runId}/research/claims`).catch(() => []), [runId]);
  const discovered = useLoad(() => api<any[]>(`/runs/${runId}/research/discovered-sources`).catch(() => []), [runId]);
  const [mode, setMode] = useState("curated_first");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [narrowScope, setNarrowScope] = useState("");
  const [newSource, setNewSource] = useState({ title: "", url: "", origin: "library" });
  const [newClaim, setNewClaim] = useState({ text: "", status: "assumption", sourceIds: "" });

  const act = async (fn: () => Promise<unknown>, done?: string) => {
    setError("");
    try {
      await fn();
      if (done) setMsg(done);
      await Promise.all([brief.reload(), gaps.reload(), sources.reload(), claims.reload(), discovered.reload()]);
    } catch (e) {
      setError(formatError(e));
    }
  };

  const header = brief.data?.header ?? brief.data?.angleHeader;
  const gapList = Array.isArray(gaps.data) ? gaps.data : gaps.data?.gaps ?? [];

  return (
    <div>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      {(run?.angleCompleteness === "title_only" || header) && (
        <div className="banner">
          Research boundary:{" "}
          {header ?? "title-only angle — question only, no scope boundary"}
          {run?.storyQuestion && (
            <>
              <br />
              Story question: <strong>{run.storyQuestion}</strong>
            </>
          )}
        </div>
      )}
      {!run?.angleId && !header && (
        <div className="banner info">Research boundary: no angle scope — question only{run?.storyQuestion ? `: ${run.storyQuestion}` : ""}.</div>
      )}

      <div className="card">
        <div className="row">
          <label style={{ margin: 0 }}>Research mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ maxWidth: 220 }}>
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <JobButton
            label="Run research (job)"
            action="research_run"
            estimateParams={{ units: 1 }}
            start={(jc) => api(`/runs/${runId}/research/run`, jobBody(jc, { mode }))}
            onDone={() => { void brief.reload(); void gaps.reload(); void sources.reload(); void claims.reload(); void discovered.reload(); }}
          />
          <button className="btn" onClick={() => act(() => api(`/runs/${runId}/research/approve`, { body: {} }), "Research approved.")}>
            Approve research
          </button>
        </div>
        <p className="small muted">
          Curated sources first: the platform never searches the web silently. Verified facts need 1
          tier-1 source or 2 independent credible sources — the API rejects claims that don't meet the
          standard.
        </p>
      </div>

      {gapList.length > 0 && (
        <div className="card" style={{ borderColor: "var(--warn)" }}>
          <h3>Evidence gaps</h3>
          <p className="small muted">These parts of the script are not supported by the curated library yet:</p>
          <pre className="json">{JSON.stringify(gapList, null, 2)}</pre>
          <div className="row">
            <JobButton
              label="Approve web search for these gaps (job)"
              action="research_run"
              estimateParams={{ units: 1 }}
              className="btn"
              start={(jc) => api(`/runs/${runId}/research/approve-web-fallback`, jobBody(jc))}
              onDone={() => { void brief.reload(); void gaps.reload(); void discovered.reload(); }}
            />
          </div>
          <label>Or accept a narrower script on supported material — proposed reduced scope</label>
          <input value={narrowScope} onChange={(e) => setNarrowScope(e.target.value)} placeholder="Reduced scope the script will cover" />
          <button
            className="btn secondary small"
            disabled={!narrowScope.trim()}
            onClick={() => act(() => api(`/runs/${runId}/research/narrow-scope`, { body: { acceptedScope: narrowScope } }), "Narrower scope accepted.")}
          >
            Accept narrower scope
          </button>
        </div>
      )}

      <div className="card">
        <h3>Brief</h3>
        {brief.loading ? <Loading /> : brief.data ? (
          <pre className="json">{JSON.stringify(brief.data, null, 2)}</pre>
        ) : (
          <p className="muted">No research yet. Run research to build the brief.</p>
        )}
      </div>

      <div className="card">
        <h3>Sources</h3>
        <p className="small muted">Origin, credibility tier and review status are three separate values. Tier 5 = blocked / do-not-use.</p>
        {(sources.data ?? []).map((s: any) => (
          <div key={s.id} style={{ borderBottom: "1px solid var(--line)", padding: "6px 0" }}>
            <strong>{s.title ?? s.name ?? s.url}</strong>{" "}
            <span className="badge">origin: {s.origin ?? "—"}</span>{" "}
            <span className="badge">tier: {s.credibilityTier ?? "needs review"}</span>{" "}
            <span className={`badge ${s.reviewStatus === "approved" ? "ok" : s.reviewStatus === "blocked" ? "bad" : "warn"}`}>
              {s.reviewStatus ?? "pending"}
            </span>{" "}
            <span className="badge">{s.availability ?? "enabled"}</span>
          </div>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <input placeholder="Source title" style={{ flex: 1 }} value={newSource.title} onChange={(e) => setNewSource({ ...newSource, title: e.target.value })} />
          <input placeholder="URL" style={{ flex: 1 }} value={newSource.url} onChange={(e) => setNewSource({ ...newSource, url: e.target.value })} />
          <button className="btn secondary small" onClick={() => act(() => api(`/runs/${runId}/research/sources`, { body: newSource }))}>
            Add source
          </button>
        </div>
      </div>

      {(discovered.data ?? []).length > 0 && (
        <div className="card">
          <h3>Web-discovered sources</h3>
          <p className="small muted">Found via approved web search — labelled separately from library/approved sources until reviewed.</p>
          {(discovered.data ?? []).map((s: any) => (
            <div key={s.id} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "6px 0" }}>
              <span style={{ flex: 1 }}>
                <strong>{s.title ?? s.url}</strong> <span className="badge warn">Web-discovered</span>{" "}
                <span className="badge">{s.reviewStatus ?? "pending"}</span>
              </span>
              {["approve", "block", "leave"].map((decision) => (
                <button
                  key={decision}
                  className="btn ghost small"
                  onClick={() => act(() => api(`/runs/${runId}/research/sources/${s.id}/review`, { body: { decision } }))}
                >
                  {decision}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Claims</h3>
        {(claims.data ?? []).map((c: any) => (
          <div key={c.id} style={{ borderBottom: "1px solid var(--line)", padding: "6px 0" }}>
            <span className={`badge ${c.status === "verified_fact" ? "ok" : c.riskLevel === "high" || c.riskLevel === "critical" ? "bad" : ""}`}>
              {c.status}
            </span>{" "}
            {c.text}
            {c.riskLevel && <span className="badge warn">risk: {c.riskLevel}</span>}
            <div className="small muted">
              Sources: {(c.sourceIds ?? c.sources ?? []).length ? JSON.stringify(c.sourceIds ?? c.sources) : "none — a claim without a source cannot pass"}
            </div>
          </div>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <input placeholder="Claim text" style={{ flex: 2 }} value={newClaim.text} onChange={(e) => setNewClaim({ ...newClaim, text: e.target.value })} />
          <select style={{ flex: 1 }} value={newClaim.status} onChange={(e) => setNewClaim({ ...newClaim, status: e.target.value })}>
            <option value="verified_fact">verified_fact</option>
            <option value="assumption">assumption</option>
            <option value="speculation">speculation</option>
            <option value="traditional_use">traditional_use</option>
          </select>
          <input placeholder="Source IDs (comma-separated)" style={{ flex: 1 }} value={newClaim.sourceIds} onChange={(e) => setNewClaim({ ...newClaim, sourceIds: e.target.value })} />
          <button
            className="btn secondary small"
            onClick={() =>
              act(() =>
                api(`/runs/${runId}/research/claims`, {
                  body: { text: newClaim.text, status: newClaim.status, sourceIds: newClaim.sourceIds.split(",").map((s) => s.trim()).filter(Boolean) },
                }),
              )
            }
          >
            Add claim
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Outline (Step 9) ---------------- */

export function OutlinePanel({ runId }: { runId: string }) {
  const outline = useLoad(() => api<any>(`/runs/${runId}/outline`).catch(() => null), [runId]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (outline.data) setDraft(JSON.stringify(outline.data.sections ?? outline.data, null, 2));
  }, [outline.data]);

  return (
    <div className="card">
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      <div className="row">
        <JobButton
          label="Generate outline (job)"
          action="outline_generate"
          estimateParams={{ units: 1 }}
          start={(jc) => api(`/runs/${runId}/outline/generate`, jobBody(jc))}
          onDone={() => outline.reload()}
        />
        <button
          className="btn"
          onClick={async () => {
            setError("");
            try {
              await api(`/runs/${runId}/outline/approve`, { body: {} });
              setMsg("Outline approved.");
              await outline.reload();
            } catch (e) {
              setError(formatError(e));
            }
          }}
        >
          Approve outline (approval)
        </button>
      </div>
      {outline.loading ? <Loading /> : outline.data ? (
        <>
          <p className="small muted">
            Sections: Hook, Intro, Setup, Developments, Conflict/Tension, Revelations, Transitions,
            Climax/Payoff, Conclusion, CTA. Edit the JSON below (reorder by moving blocks), then save.
          </p>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} style={{ minHeight: 300, fontFamily: "monospace" }} />
          <button
            className="btn secondary"
            style={{ marginTop: 10 }}
            onClick={async () => {
              setError("");
              try {
                const parsed = JSON.parse(draft);
                await api(`/runs/${runId}/outline`, {
                  method: "PATCH",
                  body: Array.isArray(parsed) ? { sections: parsed } : parsed,
                });
                setMsg("Outline saved.");
                await outline.reload();
              } catch (e) {
                setError(formatError(e));
              }
            }}
          >
            Save outline
          </button>
        </>
      ) : (
        <Empty>No outline yet. Generate one to begin.</Empty>
      )}
    </div>
  );
}

/* ---------------- Script (Step 10) ---------------- */

export function ScriptPanel({ runId }: { runId: string }) {
  const script = useLoad(() => api<any>(`/runs/${runId}/script`).catch(() => null), [runId]);
  const versions = useLoad(() => api<any[]>(`/runs/${runId}/script/versions`).catch(() => []), [runId]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const sections: any[] = script.data?.sections ?? [];
  const saveSection = async (key: string) => {
    setError("");
    try {
      await api(`/runs/${runId}/script`, { method: "PATCH", body: { sections: { [key]: edits[key] } } });
      setMsg(`Section ${key} saved (new version).`);
      await script.reload();
      await versions.reload();
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
          <JobButton
            label="Generate draft (job)"
            action="script_generate"
            estimateParams={{ units: 1 }}
            start={(jc) => api(`/runs/${runId}/script/generate`, jobBody(jc))}
            onDone={() => { void script.reload(); void versions.reload(); }}
          />
          {script.data && (
            <span className="small muted">
              Words: {script.data.wordCount ?? script.data.totalWords ?? "—"} · Estimated duration:{" "}
              {script.data.estimatedDurationSec ?? "—"}s
              {script.data.durationDeltaSec !== undefined && (
                <> · Δ vs target: {script.data.durationDeltaSec > 0 ? "+" : ""}{script.data.durationDeltaSec}s</>
              )}{" "}
              · Version {script.data.version ?? script.data.versionNo ?? "—"} · {(versions.data ?? []).length} version(s) in history
            </span>
          )}
        </div>
      </div>
      {script.loading ? <Loading /> : sections.length === 0 ? (
        <Empty>No script yet. Generate a draft from the approved outline.</Empty>
      ) : (
        sections.map((s: any) => {
          const key = s.key ?? s.sectionKey;
          const text = edits[key] ?? s.text ?? s.narration ?? "";
          return (
            <div key={key} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{s.title ?? key}</strong>
                <span className="small muted">{String(text).split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea value={text} onChange={(e) => setEdits({ ...edits, [key]: e.target.value })} style={{ minHeight: 140 }} />
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn secondary small" onClick={() => saveSection(key)}>
                  Save section
                </button>
                <JobButton
                  label="Regenerate section (job)"
                  action="script_generate"
                  estimateParams={{ units: 1 }}
                  className="btn ghost small"
                  start={(jc) => api(`/runs/${runId}/script/sections/${key}/regenerate`, jobBody(jc))}
                  onDone={() => script.reload()}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

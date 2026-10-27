"use client";

import { useState } from "react";
import { PACKAGE_DELIVERABLES } from "@scriptwriter/shared";
import { api, formatError } from "../lib/api";
import { Empty, ErrorBox, JobButton, Loading, jobBody, useLoad } from "./ui";
import UploadButton from "./UploadButton";

/* ---------------- Scenes (Step 11) ---------------- */

const SCENE_FIELDS = [
  "purpose", "narration", "speakerLabel", "visualDirection", "shotDescription", "shotType",
  "cameraMove", "animationNote", "footageRequirement", "aiImagePrompt", "aiVideoPrompt",
  "onScreenText", "musicCue", "transition", "retentionNote", "periodLabel",
] as const;

export function ScenesPanel({ runId }: { runId: string }) {
  const scenesRes = useLoad(() => api<any>(`/runs/${runId}/scenes`).catch(() => null), [runId]);
  const [cleanVo, setCleanVo] = useState(false);
  const [error, setError] = useState("");
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [newScene, setNewScene] = useState(false);

  const scenes: any[] = scenesRes.data?.scenes ?? (Array.isArray(scenesRes.data) ? scenesRes.data : []);
  const totals = scenesRes.data?.totals ?? {};
  const missingVisual = scenes.filter((s) => !(s.visualDirection || s.aiImagePrompt || s.aiVideoPrompt || s.footageRequirement)).length;

  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await scenesRes.reload();
    } catch (e) {
      setError(formatError(e));
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const order = scenes.map((s) => s.id);
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    await act(() => api(`/runs/${runId}/scenes/reorder`, { body: { order } }));
  };

  return (
    <div>
      <ErrorBox error={error} />
      <div className="card">
        <div className="row">
          <JobButton
            label="Generate scenes (job)"
            action="scene_generate"
            estimateParams={{ units: 1 }}
            start={(jc) => api(`/runs/${runId}/scenes/generate`, jobBody(jc))}
            onDone={() => scenesRes.reload()}
          />
          <button className={`btn small ${cleanVo ? "" : "secondary"}`} onClick={() => setCleanVo(!cleanVo)}>
            Clean VO view {cleanVo ? "on" : "off"}
          </button>
          <button className="btn secondary small" onClick={() => setNewScene(true)}>
            Add scene
          </button>
          <UploadButton label="Attach reference file" />
          <span className="small muted">
            Scenes: {totals.sceneCount ?? scenes.length} · Words: {totals.totalWords ?? "—"} · Est. duration:{" "}
            {totals.totalDurationEstSec ?? totals.estimatedDurationSec ?? "—"}s ·{" "}
            <strong style={{ color: missingVisual ? "var(--danger)" : "var(--accent2)" }}>
              Scenes missing visual: {missingVisual} (must be 0)
            </strong>
          </span>
        </div>
        <p className="small muted">
          Generation runs in ranges of 25 scenes. Every scene needs narration + a visual to be complete;
          chart scenes carry a structured DataViz spec whose series must link to evidence.
        </p>
      </div>

      {scenesRes.loading ? <Loading /> : scenes.length === 0 ? (
        <Empty>No scenes yet. Generate the scene breakdown from the script.</Empty>
      ) : cleanVo ? (
        <div className="card">
          {scenes.map((s) => (
            <p key={s.id}>
              <span className="badge">#{s.sceneNo}</span> {s.narration}
            </p>
          ))}
        </div>
      ) : (
        scenes.map((s, idx) => {
          const draft = { ...s, ...(edits[s.id] ?? {}) };
          const complete = s.complete ?? (!s.gaps || s.gaps.length === 0);
          return (
            <div key={s.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>
                  Scene {s.sceneNo} {s.chapterId ? `· ${s.chapterId}` : ""} {s.sectionKey ? `· ${s.sectionKey}` : ""}
                </strong>
                <span className="row">
                  <span className={`badge ${complete ? "ok" : "bad"}`}>{complete ? "complete" : `incomplete: ${(s.gaps ?? []).join(", ")}`}</span>
                  {s.legalRiskFlag && s.legalRiskFlag !== "none" && <span className="badge warn">legal: {s.legalRiskFlag}</span>}
                  <span className="badge">{draft.voWordCount ?? "?"} words · ~{draft.estimatedVoSec ?? draft.durationEstSec ?? "?"}s</span>
                </span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
                {SCENE_FIELDS.map((f) => (
                  <div key={f}>
                    <label>{f}</label>
                    {f === "narration" || f === "visualDirection" || f === "shotDescription" ? (
                      <textarea
                        value={draft[f] ?? ""}
                        onChange={(e) => setEdits({ ...edits, [s.id]: { ...(edits[s.id] ?? {}), [f]: e.target.value } })}
                      />
                    ) : (
                      <input
                        value={draft[f] ?? ""}
                        onChange={(e) => setEdits({ ...edits, [s.id]: { ...(edits[s.id] ?? {}), [f]: e.target.value } })}
                      />
                    )}
                  </div>
                ))}
              </div>
              {(draft.sfx ?? []).length >= 0 && (
                <p className="small muted">
                  SFX: {(draft.sfx ?? []).join(", ") || "—"} · Continuity: {draft.continuityState?.startState ?? "—"} →{" "}
                  {draft.continuityState?.endState ?? "—"} · Claims: {(draft.claimIds ?? []).join(", ") || "—"} ·
                  Registry refs: chars {(draft.registryRefs?.characterIds ?? []).join(", ") || "—"}, locations{" "}
                  {(draft.registryRefs?.locationIds ?? []).join(", ") || "—"}, props {(draft.registryRefs?.propIds ?? []).join(", ") || "—"}
                </p>
              )}
              {draft.dataVizSpec && (
                <details>
                  <summary>DataViz spec (chart scene)</summary>
                  <pre className="json">{JSON.stringify(draft.dataVizSpec, null, 2)}</pre>
                  {(draft.dataVizSpec.series ?? []).some((x: any) => !x.sourceRef) && (
                    <p className="badge bad">missing_evidence — a series is not linked to verified data</p>
                  )}
                </details>
              )}
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  className="btn secondary small"
                  onClick={() => act(() => api(`/runs/${runId}/scenes/${s.id}`, { method: "PATCH", body: edits[s.id] ?? {} }))}
                >
                  Save scene
                </button>
                <JobButton
                  label="Regenerate (job)"
                  action="scene_generate"
                  estimateParams={{ units: 1 }}
                  className="btn ghost small"
                  start={(jc) => api(`/runs/${runId}/scenes/${s.id}/regenerate`, jobBody(jc))}
                  onDone={() => scenesRes.reload()}
                />
                <button className="btn ghost small" onClick={() => move(idx, -1)}>↑ Move</button>
                <button className="btn ghost small" onClick={() => move(idx, 1)}>↓ Move</button>
                <button className="btn ghost small" onClick={() => act(() => api(`/runs/${runId}/scenes/${s.id}`, { method: "DELETE" }))}>
                  Delete
                </button>
              </div>
            </div>
          );
        })
      )}

      {newScene && (
        <div className="card">
          <h3>New scene</h3>
          <SceneQuickAdd
            onAdd={async (body) => {
              await act(() => api(`/runs/${runId}/scenes`, { body }));
              setNewScene(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function SceneQuickAdd({ onAdd }: { onAdd: (body: any) => Promise<void> }) {
  const [f, setF] = useState({ purpose: "", narration: "", visualDirection: "", onScreenText: "" });
  return (
    <div>
      {Object.keys(f).map((k) => (
        <div key={k}>
          <label>{k}</label>
          <textarea value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        </div>
      ))}
      <button className="btn small" style={{ marginTop: 8 }} onClick={() => onAdd(f)}>
        Add scene
      </button>
    </div>
  );
}

/* ---------------- Audit (Steps 12–13) ---------------- */

export function AuditPanel({ runId }: { runId: string }) {
  const report = useLoad(() => api<any>(`/runs/${runId}/audit`).catch(() => null), [runId]);
  const certificate = useLoad(() => api<any>(`/runs/${runId}/certificate`).catch(() => null), [runId]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [override, setOverride] = useState(false);
  const [note, setNote] = useState("");

  const r = report.data;
  const areas: any[] = r?.areas ?? [];
  const failures: any[] = r?.failures ?? areas.flatMap((a: any) => (a.checks ?? []).filter((c: any) => c.status === "fail").map((c: any) => ({ ...c, area: a.key })));
  const naChecks = areas.flatMap((a: any) => (a.checks ?? []).filter((c: any) => c.status === "na"));

  return (
    <div>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      <div className="card">
        <div className="row">
          <JobButton
            label="Run audit (job)"
            action="audit_run"
            estimateParams={{ units: 1 }}
            start={(jc) => api(`/runs/${runId}/audit/run`, jobBody(jc))}
            onDone={() => report.reload()}
          />
          <JobButton
            label="Re-run failed areas (job)"
            action="audit_run"
            estimateParams={{ units: 1 }}
            className="btn secondary"
            start={(jc) => api(`/runs/${runId}/audit/re-run`, jobBody(jc))}
            onDone={() => report.reload()}
          />
        </div>
        {r && (
          <div style={{ marginTop: 12 }}>
            <p>
              Total score: <strong>{r.totalScore ?? "—"}</strong> · Passed:{" "}
              <span className={`badge ${r.passed ? "ok" : "bad"}`}>{r.passed ? "yes" : "no"}</span>{" "}
              {r.weightConfigVersion && <span className="badge">weights v{r.weightConfigVersion}</span>}{" "}
              {r.incomplete && <span className="badge bad">Incomplete — a required area could not be assessed</span>}{" "}
              <span className="badge">N/A checks: {naChecks.length}</span>
            </p>
            {r.blockedByCritical?.length > 0 && (
              <div className="error-box">
                Critical checks block passing regardless of the total: {JSON.stringify(r.blockedByCritical)}
              </div>
            )}
            {r.editorialDepth && (
              <p className="small">
                <strong>Editorial Depth</strong> (per-deliverable verdicts, never blended into the score):{" "}
                {JSON.stringify(r.editorialDepth)} — a “Needs work” verdict blocks Final Approval.
              </p>
            )}
          </div>
        )}
      </div>

      {report.loading ? <Loading /> : !r ? (
        <Empty>No audit report yet. Run the audit to score the run.</Empty>
      ) : (
        <>
          <div className="card" style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Area</th><th>Score /10</th><th>Weight</th><th>Checks</th></tr></thead>
              <tbody>
                {areas.map((a: any) => (
                  <tr key={a.key ?? a.area}>
                    <td>{a.label ?? a.key}</td>
                    <td>{a.status === "na" || a.score === null ? `N/A (${a.naReason ?? "not applicable — weight redistributed"})` : a.score}</td>
                    <td>{a.weight ?? "—"}</td>
                    <td>
                      {(a.checks ?? []).map((c: any) => (
                        <span key={c.key} className={`badge ${c.status === "pass" ? "ok" : c.status === "fail" ? "bad" : c.status === "na" ? "" : "warn"}`} title={c.reason ?? c.explanation ?? ""}>
                          {c.key}: {c.status}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {naChecks.length > 0 && (
              <details>
                <summary>N/A checks with reasons ({naChecks.length})</summary>
                <pre className="json">{JSON.stringify(naChecks, null, 2)}</pre>
              </details>
            )}
          </div>

          {failures.length > 0 && (
            <div className="card">
              <h3>Failures &amp; revision queue</h3>
              {failures.map((f: any) => (
                <div key={f.key ?? f.checkKey} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
                  <span style={{ flex: 1 }}>
                    <strong>{f.key ?? f.checkKey}</strong>
                    {f.sceneNos?.length ? ` · scenes ${f.sceneNos.join(", ")}` : ""} — {f.explanation ?? f.message ?? ""}
                    {f.suggestedFix && <div className="small muted">Suggested fix: {f.suggestedFix}</div>}
                  </span>
                  <JobButton
                    label="Auto-fix (job)"
                    action="audit_autofix"
                    estimateParams={{ units: 1 }}
                    className="btn secondary small"
                    start={(jc) => api(`/runs/${runId}/audit/failures/${f.key ?? f.checkKey}/auto-fix`, jobBody(jc))}
                    onDone={() => report.reload()}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="card">
        <h3>Final Approval (Step 13)</h3>
        <p className="small muted">
          All mandatory criteria must pass, or record an override with the unresolved flags kept visible.
          Approval issues the run's Completion Certificate.
        </p>
        <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={override} onChange={(e) => setOverride(e.target.checked)} />
          Override (record why below)
        </label>
        <label>Note</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Approval note / override reason" />
        <div className="row" style={{ marginTop: 10 }}>
          <button
            className="btn"
            onClick={async () => {
              setError("");
              try {
                await api(`/runs/${runId}/final-approve`, { body: { override, note: note || undefined } });
                setMsg("Final approval recorded. Completion Certificate issued.");
                await certificate.reload();
              } catch (e) {
                setError(formatError(e));
              }
            }}
          >
            Approve final
          </button>
        </div>
        {certificate.data && (
          <details style={{ marginTop: 10 }}>
            <summary>Completion Certificate</summary>
            <pre className="json">{JSON.stringify(certificate.data, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

/* ---------------- Package (Step 14) ---------------- */

export function PackagePanel({ runId }: { runId: string }) {
  const checklist = useLoad(() => api<any>(`/runs/${runId}/package/checklist`).catch(() => null), [runId]);
  const manifest = useLoad(() => api<any>(`/runs/${runId}/package`).catch(() => null), [runId]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [formatProfileId, setFormatProfileId] = useState("");
  const [override, setOverride] = useState(false);
  const [error, setError] = useState("");

  const stateOf = (key: string, core: boolean): string => {
    const item = (checklist.data?.items ?? checklist.data ?? []).find?.((i: any) => i.key === key);
    return item?.state ?? item?.status ?? (core ? "core" : "optional");
  };
  const isOn = (key: string, core: boolean) => core || (selected[key] ?? stateOf(key, core) === "included");

  return (
    <div>
      <ErrorBox error={error} />
      {manifest.data?.status === "outdated" && (
        <div className="banner">Package outdated — the script or scenes changed after packaging. Regenerate.</div>
      )}
      <div className="card">
        <h3>Deliverables checklist</h3>
        <p className="small muted">
          The canonical {PACKAGE_DELIVERABLES.length} deliverables &amp; records. Core items are always
          built and cannot be deselected.
        </p>
        {PACKAGE_DELIVERABLES.map((d) => {
          const core = d.inclusion === "core";
          return (
            <div key={d.key} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "5px 0" }}>
              <input
                type="checkbox"
                style={{ width: "auto" }}
                disabled={core}
                checked={isOn(d.key, core)}
                onChange={(e) => setSelected({ ...selected, [d.key]: e.target.checked })}
              />
              <span style={{ flex: 1 }}>
                {d.label} <span className="small muted">({d.inclusion})</span>
              </span>
              <span className="badge">{stateOf(d.key, core)}</span>
            </div>
          );
        })}
        <label>Output format profile ID (optional — default comes from the run's asset method, B18)</label>
        <input value={formatProfileId} onChange={(e) => setFormatProfileId(e.target.value)} placeholder="Profile id from Admin library" style={{ maxWidth: 340 }} />
        <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={override} onChange={(e) => setOverride(e.target.checked)} />
          Override (only if the API allows it without a certificate — otherwise it returns 422)
        </label>
        <div className="row" style={{ marginTop: 10 }}>
          <JobButton
            label="Generate package (job)"
            action="package_generate"
            estimateParams={{ units: 1 }}
            start={(jc) =>
              api(`/runs/${runId}/package/generate`, jobBody(jc, {
                deliverables: PACKAGE_DELIVERABLES.filter((d) => isOn(d.key, d.inclusion === "core")).map((d) => d.key),
                ...(formatProfileId ? { formatProfileId } : {}),
                ...(override ? { override: true } : {}),
              }))
            }
            onDone={() => manifest.reload()}
          />
        </div>
        <p className="small muted">
          Package generation requires Audit + Final Approval (the Completion Certificate) unless an
          override is recorded — the API enforces this and returns 422 otherwise.
        </p>
      </div>

      <div className="card">
        <h3>Manifest</h3>
        {manifest.loading ? <Loading /> : manifest.data?.files?.length ? (
          <table>
            <thead><tr><th>File</th><th>Deliverable</th><th></th></tr></thead>
            <tbody>
              {manifest.data.files.map((f: any, i: number) => (
                <tr key={i}>
                  <td>{f.name ?? f.key}</td>
                  <td>{f.deliverableKey ?? f.kind ?? ""}</td>
                  <td>{f.downloadUrl && <a className="btn ghost small" href={f.downloadUrl}>Download</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="json">{JSON.stringify(manifest.data ?? {}, null, 2)}</pre>
        )}
        {manifest.data?.generatorProfile && (
          <details>
            <summary>Generator Profile (tool/model/version + verified capabilities)</summary>
            <pre className="json">{JSON.stringify(manifest.data.generatorProfile, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

/* ---------------- Performance (Step 15) ---------------- */

export function PerformancePanel({ runId }: { runId: string }) {
  const perf = useLoad(() => api<any>(`/runs/${runId}/performance`).catch(() => null), [runId]);
  const corrections = useLoad(() => api<any[]>(`/runs/${runId}/corrections`).catch(() => []), [runId]);
  const [form, setForm] = useState<Record<string, string>>({
    youtubeVideoId: "", views: "", ctr: "", retentionPct: "", avgViewDurationSec: "", likes: "", comments: "",
  });
  const [csv, setCsv] = useState("");
  const [correction, setCorrection] = useState({ whatWasWrong: "", whatChanged: "" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const act = async (fn: () => Promise<unknown>, done?: string) => {
    setError("");
    try {
      await fn();
      if (done) setMsg(done);
      await perf.reload();
      await corrections.reload();
    } catch (e: any) {
      if (e?.code === "VALIDATION" && e?.details?.reason === "no_video_match") {
        setError("YouTube sync found no matching video — set this run's YouTube video ID first (matching is by the ID you set, never guessed).");
      } else {
        setError(formatError(e));
      }
    }
  };

  const d = perf.data ?? {};
  return (
    <div>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      <div className="card">
        <h3>Run ↔ video matching</h3>
        <p className="small muted">
          Paste the published video's URL or ID. Until it is set, the run shows “not matched” and sync
          does nothing.
        </p>
        <div className="row">
          <input placeholder="YouTube video ID or URL" style={{ flex: 1 }} value={form.youtubeVideoId} onChange={(e) => setForm({ ...form, youtubeVideoId: e.target.value })} />
          <span className="badge">{d.youtubeVideoId ? `matched: ${d.youtubeVideoId}` : "not matched"}</span>
          <span className="badge">sync: {d.syncStatus ?? "never synced"}{d.lastSyncedAt ? ` · ${new Date(d.lastSyncedAt).toLocaleString()}` : ""}</span>
        </div>
        {d.syncStatus === "reauth_required" && (
          <div className="banner">YouTube connection needs re-authentication — reconnect in Settings → YouTube connection.</div>
        )}
        {d.syncStatus === "quota_exceeded" && (
          <div className="banner info">YouTube quota exceeded — metrics resume when the quota resets.</div>
        )}
        <div className="row" style={{ marginTop: 10 }}>
          <button
            className="btn secondary"
            onClick={() => act(() => api(`/runs/${runId}/performance/sync`, { body: {} }), "YouTube sync complete.")}
          >
            Sync from YouTube
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Metrics (manual entry / correction)</h3>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))" }}>
          {["views", "ctr", "retentionPct", "avgViewDurationSec", "likes", "comments"].map((k) => (
            <div key={k}>
              <label>{k}</label>
              <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <button
          className="btn"
          style={{ marginTop: 10 }}
          onClick={() =>
            act(
              () =>
                api(`/runs/${runId}/performance`, {
                  method: d?.id ? "PATCH" : "POST",
                  body: {
                    youtubeVideoId: form.youtubeVideoId || undefined,
                    views: Number(form.views) || undefined,
                    ctr: Number(form.ctr) || undefined,
                    retentionPct: Number(form.retentionPct) || undefined,
                    avgViewDurationSec: Number(form.avgViewDurationSec) || undefined,
                    likes: Number(form.likes) || undefined,
                    comments: Number(form.comments) || undefined,
                  },
                }),
              "Metrics saved.",
            )
          }
        >
          Save metrics
        </button>
        {d?.id && <pre className="json" style={{ marginTop: 10 }}>{JSON.stringify(d, null, 2)}</pre>}
        <label>…or import CSV</label>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="Paste CSV rows" />
        <button className="btn secondary small" onClick={() => act(() => api(`/runs/${runId}/performance/import`, { body: { csv } }), "CSV imported.")}>
          Import CSV
        </button>
      </div>

      <div className="card">
        <h3>Insights</h3>
        <p className="small muted">
          Insights suggest changes to topic weights, future topic generation, and Bible §14 Performance
          Learnings — as a proposed edit you approve in the project's Bible inbox. The locked Bible is
          never auto-edited.
        </p>
        <JobButton
          label="Generate insights (job)"
          action="insights_generate"
          estimateParams={{ units: 1 }}
          start={(jc) => api(`/runs/${runId}/performance/insights`, jobBody(jc))}
          onDone={() => perf.reload()}
        />
        {d?.insights && <pre className="json" style={{ marginTop: 10 }}>{JSON.stringify(d.insights, null, 2)}</pre>}
      </div>

      <div className="card">
        <h3>Corrections Log</h3>
        {(corrections.data ?? []).map((c: any) => (
          <div key={c.id} style={{ borderBottom: "1px solid var(--line)", padding: "6px 0" }}>
            <strong>{c.whatWasWrong ?? c.title ?? "Correction"}</strong>
            <div className="small muted">{c.whatChanged ?? ""} · {c.date ?? c.createdAt ?? ""}</div>
          </div>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <input placeholder="What was wrong" style={{ flex: 1 }} value={correction.whatWasWrong} onChange={(e) => setCorrection({ ...correction, whatWasWrong: e.target.value })} />
          <input placeholder="What changed" style={{ flex: 1 }} value={correction.whatChanged} onChange={(e) => setCorrection({ ...correction, whatChanged: e.target.value })} />
          <button className="btn secondary small" onClick={() => act(() => api(`/runs/${runId}/corrections`, { body: correction }), "Correction logged.")}>
            Add correction
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Optional modules 16/17 ---------------- */

export function AssetsPanel({ runId }: { runId: string }) {
  const assets = useLoad(() => api<any>(`/runs/${runId}/assets`).catch((e) => { throw e; }), [runId]);
  if (assets.error) {
    if (assets.error.includes("FEATURE_DISABLED")) {
      return <div className="card"><h3>Module disabled</h3><p className="muted">Visual &amp; Asset Research (Step 16) is not enabled for this platform yet.</p></div>;
    }
    return <ErrorBox error={assets.error} />;
  }
  const items: any[] = assets.data?.assets ?? (Array.isArray(assets.data) ? assets.data : []);
  return (
    <div>
      <div className="card">
        <JobButton
          label="Research assets (job)"
          action="asset_research"
          estimateParams={{ units: 1 }}
          start={(jc) => api(`/runs/${runId}/assets/research`, jobBody(jc))}
          onDone={() => assets.reload()}
        />
        <p className="small muted">Per-scene footage, archive images, graphics and music with licensing / attribution / rights status. No unverified asset may enter the Package while this module is enabled.</p>
      </div>
      {assets.loading ? <Loading /> : items.length === 0 ? (
        <Empty>No assets yet.</Empty>
      ) : (
        <div className="card">
          {items.map((a: any) => (
            <div key={a.id} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "6px 0" }}>
              <span style={{ flex: 1 }}>
                <strong>{a.title ?? a.name ?? a.assetType}</strong> <span className="small muted">scene {a.sceneNo ?? "—"} · {a.licenseStatus ?? a.rightsStatus ?? ""}</span>
              </span>
              <span className={`badge ${a.verified ? "ok" : "warn"}`}>{a.verified ? "verified" : "unverified"}</span>
              <button
                className="btn ghost small"
                onClick={async () => {
                  await api(`/runs/${runId}/assets/${a.id}`, { method: "PATCH", body: { verified: true } });
                  await assets.reload();
                }}
              >
                Mark verified
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PublishingPanel({ runId }: { runId: string }) {
  const pub = useLoad(() => api<any>(`/runs/${runId}/publishing`).catch((e) => { throw e; }), [runId]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  if (pub.error) {
    if (pub.error.includes("FEATURE_DISABLED")) {
      return <div className="card"><h3>Module disabled</h3><p className="muted">Platform &amp; Publishing Optimization (Step 17) is not enabled for this platform yet.</p></div>;
    }
    return <ErrorBox error={pub.error} />;
  }
  return (
    <div className="card">
      <ErrorBox error={error} />
      <JobButton
        label="Generate publishing pack (job)"
        action="publishing_generate"
        estimateParams={{ units: 1 }}
        start={(jc) => api(`/runs/${runId}/publishing/generate`, jobBody(jc))}
        onDone={() => pub.reload()}
      />
      <p className="small muted">Titles, description, thumbnail brief (text), chapters, captions plan, tags and publishing recommendations — attached to the Package when generated.</p>
      {pub.loading ? <Loading /> : pub.data ? (
        <>
          <textarea
            value={draft || JSON.stringify(pub.data, null, 2)}
            onChange={(e) => setDraft(e.target.value)}
            style={{ minHeight: 260, fontFamily: "monospace" }}
          />
          <button
            className="btn secondary"
            style={{ marginTop: 10 }}
            onClick={async () => {
              setError("");
              try {
                await api(`/runs/${runId}/publishing`, { method: "PATCH", body: JSON.parse(draft || "{}") });
                await pub.reload();
              } catch (e) {
                setError(formatError(e));
              }
            }}
          >
            Save edits
          </button>
        </>
      ) : (
        <Empty>Nothing generated yet.</Empty>
      )}
    </div>
  );
}

/* ---------------- Issues + Brand approval ---------------- */

export function IssuesPanel({ runId }: { runId: string }) {
  const issues = useLoad(() => api<any[]>(`/runs/${runId}/issues`).catch(() => []), [runId]);
  const [form, setForm] = useState({ title: "", detail: "" });
  const [error, setError] = useState("");
  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await issues.reload();
    } catch (e) {
      setError(formatError(e));
    }
  };
  return (
    <div className="card">
      <h3>Open issues (Control Rule: unresolved items are tracked explicitly, never hidden)</h3>
      <ErrorBox error={error} />
      {(issues.data ?? []).map((i: any) => (
        <div key={i.id} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "6px 0" }}>
          <span style={{ flex: 1 }}>
            <strong>{i.title}</strong> <span className="small muted">{i.detail ?? ""}</span>
          </span>
          <span className={`badge ${i.status === "resolved" ? "ok" : "warn"}`}>{i.status ?? "open"}</span>
          {i.status !== "resolved" && (
            <button className="btn ghost small" onClick={() => act(() => api(`/runs/${runId}/issues/${i.id}`, { method: "PATCH", body: { status: "resolved" } }))}>
              Resolve
            </button>
          )}
        </div>
      ))}
      <div className="row" style={{ marginTop: 10 }}>
        <input placeholder="Issue title" style={{ flex: 1 }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Detail" style={{ flex: 1 }} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
        <button className="btn secondary small" onClick={() => act(() => api(`/runs/${runId}/issues`, { body: form }))}>
          Add issue
        </button>
      </div>
    </div>
  );
}

const BRAND_FLOW = ["draft", "in_review", "changes_requested", "approved", "final"];

export function BrandApprovalPanel({ runId, run }: { runId: string; run: any }) {
  const [toState, setToState] = useState("in_review");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const history: any[] = run?.brandApprovalHistory ?? run?.approvalHistory ?? [];
  const current = run?.brandApprovalState ?? "draft";
  return (
    <div className="card">
      <h3>Brand approval (solo — you perform every transition)</h3>
      <p className="small muted">
        Draft → In Review → Changes Requested (note required — it is your revision brief) → Approved →
        Final (locks the version; later edits restart at Draft on a new version).
      </p>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      <p>
        Current state: <span className="badge">{current}</span>
      </p>
      <div className="row">
        <select value={toState} onChange={(e) => setToState(e.target.value)} style={{ maxWidth: 220 }}>
          {BRAND_FLOW.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input placeholder="Note (required for Changes Requested)" style={{ flex: 1 }} value={note} onChange={(e) => setNote(e.target.value)} />
        <button
          className="btn small"
          onClick={async () => {
            setError("");
            try {
              await api(`/runs/${runId}/brand-approval`, { body: { toState, note: note || undefined } });
              setMsg(`Moved to ${toState}.`);
            } catch (e) {
              setError(formatError(e));
            }
          }}
        >
          Record transition
        </button>
      </div>
      {history.length > 0 && (
        <table style={{ marginTop: 12 }}>
          <thead><tr><th>From → To</th><th>Actor</th><th>When</th><th>Note</th></tr></thead>
          <tbody>
            {history.map((h: any, i: number) => (
              <tr key={i}>
                <td>{h.from} → {h.to}</td>
                <td>{h.actor ?? "owner"}</td>
                <td>{h.at ? new Date(h.at).toLocaleString() : ""}</td>
                <td>{h.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

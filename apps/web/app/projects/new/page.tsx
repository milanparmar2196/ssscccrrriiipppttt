"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formatError } from "../../../lib/api";
import { DynamicForm, ErrorBox, JobButton, Loading, answersFromApi, jobBody, useLoad } from "../../../components/ui";

const STEPS = ["Basics", "Niche", "Sub-niches", "Audience & Strategy", "Configuration", "Production Bible"];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // step 1
  const [name, setName] = useState("");
  const [type, setType] = useState("personal");
  const [platform, setPlatform] = useState("youtube_long");

  // step 2 niches
  const cats = useLoad(() => api<any[]>("/taxonomy/categories"), []);
  const [categoryKey, setCategoryKey] = useState("");
  const niches = useLoad(
    () => (categoryKey ? api<any[]>(`/taxonomy/niches?categoryKey=${encodeURIComponent(categoryKey)}`) : Promise.resolve([])),
    [categoryKey],
  );
  const [selectedNiches, setSelectedNiches] = useState<any[]>([]);
  const [customNiche, setCustomNiche] = useState("");

  // step 3 sub-niches (per selected niche): name/focus/audience lines
  const [subForms, setSubForms] = useState<Record<string, { name: string; focus: string; audience: string }[]>>({});


  const updateSub = (nicheKey: string, i: number, patch: Partial<{ name: string; focus: string; audience: string }>) => {
    const arr = [...(subForms[nicheKey] ?? [])];
    arr[i] = { name: "", focus: "", audience: "", ...(arr[i] ?? {}), ...patch };
    setSubForms({ ...subForms, [nicheKey]: arr });
  };

  // step 4 strategy
  const [strategy, setStrategy] = useState<Record<string, string>>({
    audienceAge: "", audienceRegion: "", knowledgeLevel: "", interests: "", painPoints: "",
    language: "en", channelName: "", channelPromise: "", videoFormat: "", contentGoals: "",
  });

  // step 5 config
  const primaryNicheId = selectedNiches[0]?.id;
  const schema = useLoad(
    () =>
      projectId
        ? api<any[]>(`/config-schema?projectId=${projectId}${primaryNicheId ? `&nicheId=${primaryNicheId}` : ""}`)
        : Promise.resolve([]),
    [projectId, primaryNicheId],
  );
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // templates for the selected niche
  const templates = useLoad(
    () => (primaryNicheId ? api<any[]>(`/niche-templates?nicheId=${primaryNicheId}`).catch(() => []) : Promise.resolve([])),
    [primaryNicheId],
  );
  const [templateId, setTemplateId] = useState("");

  const guard = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
  };

  const createProject = () =>
    guard(async () => {
      const p = await api<any>("/projects", { body: { name, type, platform } });
      setProjectId(p.id);
      setStep(1);
    });

  const saveNiches = () =>
    guard(async () => {
      if (!projectId) return;
      const all = [...selectedNiches];
      if (customNiche.trim()) all.push({ id: `custom-${Date.now()}`, name: customNiche.trim(), custom: true });
      if (all.length === 0) throw new Error("Select at least one niche (unlimited allowed).");
      await api(`/projects/${projectId}/niches`, { method: "PUT", body: { niches: all } });
      setSelectedNiches(all);
      setStep(2);
    });

  const saveSubNiches = () =>
    guard(async () => {
      if (!projectId) return;
      for (const niche of selectedNiches) {
        const subs = subForms[String(niche.id)] ?? [];
        const taxSubs = await api<any[]>(`/taxonomy/niches/${niche.id}/sub-niches`).catch(() => []);
        for (const s of taxSubs.filter((t: any) => t._selected)) void s;
        for (const s of subs) {
          if (s.name.trim()) {
            await api(`/projects/${projectId}/niches/${niche.id}/sub-niches`, {
              body: { name: s.name, focus: s.focus, audience: s.audience },
            });
          }
        }
      }
      setStep(3);
    });

  const saveStrategy = () =>
    guard(async () => {
      if (!projectId) return;
      await api(`/projects/${projectId}/audience-strategy`, { method: "PUT", body: strategy });
      setStep(4);
    });

  const saveConfig = () =>
    guard(async () => {
      if (!projectId) return;
      await api(`/projects/${projectId}/config-answers`, { body: { answers } });
      setStep(5);
    });

  const applyTemplate = () =>
    guard(async () => {
      if (!projectId || !templateId) return;
      await api(`/projects/${projectId}/apply-template`, { body: { templateId } });
      const cfg = await api<any>(`/projects/${projectId}/configuration`).catch(() => null);
      if (cfg) setAnswers(answersFromApi(cfg));
    });

  useEffect(() => {
    if (step === 4 && projectId) {
      api<any>(`/projects/${projectId}/configuration`)
        .then((cfg) => setAnswers(answersFromApi(cfg)))
        .catch(() => {});
    }
  }, [step, projectId]);

  return (
    <main className="container" style={{ maxWidth: 860 }}>
      <h1>Create project</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        {STEPS.map((s, i) => (
          <span key={s} className={`badge ${i === step ? "ok" : ""}`}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <ErrorBox error={error} />

      {step === 0 && (
        <div className="card">
          <label>Project name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. History Untold" />
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="personal">Personal</option>
            <option value="brand">Brand (solo in MVP — you perform every approval)</option>
          </select>
          <label>Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="youtube_long">YouTube — long form</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram_reels">Instagram Reels</option>
            <option value="facebook">Facebook</option>
            <option value="other">Other</option>
          </select>
          <button className="btn" style={{ marginTop: 14 }} onClick={createProject} disabled={busy || !name.trim()}>
            Create &amp; continue
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <p className="muted small">Step 1 — pick from the dynamic taxonomy, or add a custom niche. Unlimited niches.</p>
          <label>Category</label>
          {cats.loading ? (
            <Loading />
          ) : (
            <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)}>
              <option value="">— choose a category —</option>
              {(cats.data ?? []).map((c: any) => (
                <option key={c.key ?? c.categoryKey} value={c.key ?? c.categoryKey}>
                  {c.name ?? c.label ?? c.key}
                </option>
              ))}
            </select>
          )}
          {categoryKey && (
            <>
              <label>Niches in this category (click to toggle)</label>
              <div className="row">
                {(niches.data ?? []).map((n: any) => {
                  const on = selectedNiches.some((s) => String(s.id) === String(n.id));
                  return (
                    <button
                      key={n.id}
                      className={`btn small ${on ? "" : "secondary"}`}
                      onClick={() =>
                        setSelectedNiches(on ? selectedNiches.filter((s) => String(s.id) !== String(n.id)) : [...selectedNiches, n])
                      }
                    >
                      {n.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <label>Custom niche (optional)</label>
          <input value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="My own niche" />
          <p className="small muted">Selected: {selectedNiches.map((n) => n.name).join(", ") || "none yet"}</p>

          {(templates.data ?? []).length > 0 && projectId && (
            <div className="card" style={{ background: "var(--panel2)" }}>
              <strong>Niche template</strong>
              <p className="small muted">
                Applying a template pre-fills strategy, configuration, Bible and more as an editable
                snapshot. Nothing auto-updates later.
              </p>
              <div className="row">
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={{ maxWidth: 320 }}>
                  <option value="">— choose template —</option>
                  {(templates.data ?? []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.isDefault ? "(default)" : ""}
                    </option>
                  ))}
                </select>
                <button className="btn secondary small" onClick={applyTemplate} disabled={!templateId || busy}>
                  Apply template
                </button>
                <span className="small muted">or Skip and continue blank</span>
              </div>
            </div>
          )}
          <button className="btn" style={{ marginTop: 12 }} onClick={saveNiches} disabled={busy}>
            Save niches &amp; continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <p className="muted small">
            Step 2 — add sub-niches per niche (unlimited). Each needs a one-line content focus and a
            target audience note.
          </p>
          {selectedNiches.map((n: any) => (
            <div key={n.id} style={{ marginBottom: 16 }}>
              <strong>{n.name}</strong>
              <TaxSubNiches nicheId={n.id} />
              {(subForms[String(n.id)] ?? []).map((s, i) => (
                <div key={i} className="row" style={{ marginTop: 6 }}>
                  <input
                    placeholder="Sub-niche name"
                    value={s.name}
                    style={{ flex: 1 }}
                    onChange={(e) => updateSub(String(n.id), i, { name: e.target.value })}
                  />
                  <input
                    placeholder="Content focus"
                    value={s.focus}
                    style={{ flex: 1 }}
                    onChange={(e) => updateSub(String(n.id), i, { focus: e.target.value })}
                  />
                  <input
                    placeholder="Target audience"
                    value={s.audience}
                    style={{ flex: 1 }}
                    onChange={(e) => updateSub(String(n.id), i, { audience: e.target.value })}
                  />
                </div>
              ))}
              <button
                className="btn ghost small"
                style={{ marginTop: 6 }}
                onClick={() =>
                  setSubForms({
                    ...subForms,
                    [String(n.id)]: [...(subForms[String(n.id)] ?? []), { name: "", focus: "", audience: "" }],
                  })
                }
              >
                + Add sub-niche
              </button>
            </div>
          ))}
          <button className="btn" onClick={saveSubNiches} disabled={busy}>
            Save &amp; continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <p className="muted small">Step 3 — Audience &amp; Channel Strategy.</p>
          {(
            [
              ["audienceAge", "Audience age range"],
              ["audienceRegion", "Audience region"],
              ["knowledgeLevel", "Knowledge level"],
              ["interests", "Interests"],
              ["painPoints", "Pain points"],
              ["language", "Primary language"],
              ["channelName", "Channel name"],
              ["channelPromise", "Channel promise"],
              ["videoFormat", "Video format"],
              ["contentGoals", "Content goals"],
            ] as [string, string][]
          ).map(([key, label]) => (
            <div key={key}>
              <label>{label}</label>
              <input value={strategy[key]} onChange={(e) => setStrategy({ ...strategy, [key]: e.target.value })} />
            </div>
          ))}
          <button className="btn" style={{ marginTop: 12 }} onClick={saveStrategy} disabled={busy}>
            Save strategy &amp; continue
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <p className="muted small">
            Step 6 — Configuration Questions, rendered from the API schema for this niche (Global +
            Niche + Sub-Niche sets). Switching niche reloads the set; answers for questions no longer
            shown are kept on the project, never silently lost.
          </p>
          {schema.loading ? <Loading /> : <DynamicForm questions={schema.data ?? []} answers={answers} onChange={setAnswers} />}
          <button className="btn" style={{ marginTop: 12 }} onClick={saveConfig} disabled={busy}>
            Save configuration &amp; continue
          </button>
        </div>
      )}

      {step === 5 && projectId && (
        <div className="card">
          <p className="muted small">
            Step 8 — generate a Production Bible draft from your strategy + configuration, then review
            its 14 sections and approve it in the project's Bible tab. A project cannot start a run
            until a Bible version is approved.
          </p>
          <div className="row">
            <JobButton
              label="Generate Bible draft (job)"
              action="bible_generate"
              estimateParams={{ units: 1 }}
              start={(jc) => api(`/projects/${projectId}/bible/generate`, jobBody(jc))}
              onDone={() => router.push(`/projects/${projectId}?tab=bible`)}
            />
            <Link className="btn secondary" href={`/projects/${projectId}`}>
              Go to project
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function TaxSubNiches({ nicheId }: { nicheId: string | number }) {
  const subs = useLoad(() => api<any[]>(`/taxonomy/niches/${nicheId}/sub-niches`).catch(() => []), [nicheId]);
  if (!subs.data?.length) return null;
  return (
    <p className="small muted">
      Taxonomy sub-niches: {subs.data.map((s: any) => s.name).join(", ")}
    </p>
  );
}

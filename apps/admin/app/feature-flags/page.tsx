"use client";

import { useState } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/ui";

const DESCRIPTIONS: Record<string, string> = {
  module16_assets: "Optional module 16 — Visual & Asset Research.",
  module17_publishing: "Optional module 17 — Platform & Publishing Optimization.",
  webResearchFallback: "Web-research fallback for Step 7. Rules cannot be loosened from here: curated_first always asks the user before any web search.",
};

export default function FeatureFlagsPage() {
  const { data, error, loading, reload } = useLoad<Obj>(() => api<Obj>("/admin/feature-flags"));
  const [draft, setDraft] = useState<Obj | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const flags = draft ?? data ?? {};

  const save = async () => {
    setBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      await api("/admin/feature-flags", { method: "PUT", body: flags });
      setActionOk("Feature flags saved.");
      setDraft(null);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>Feature Flags</h1>
      <p className="subtle">
        Global platform flags. Turning a flag off never breaks an in-progress run — it blocks new starts (the API
        enforces this).
      </p>
      <ErrorBox error={error ?? actionError} />
      {actionOk && <div className="ok-box">{actionOk}</div>}
      {loading ? (
        <Loading />
      ) : (
        <div className="panel">
          {Object.keys(flags).length === 0 && <p className="subtle">No flags returned.</p>}
          {Object.entries(flags).map(([key, value]) => (
            <div key={key} style={{ borderBottom: "1px solid #eceef2", padding: "12px 0" }}>
              <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => setDraft({ ...flags, [key]: e.target.checked })}
                />
                <code>{key}</code>
              </label>
              <p className="subtle" style={{ margin: "6px 0 0 26px" }}>
                {DESCRIPTIONS[key] ?? "Custom flag."} Current: {value ? "ON" : "OFF"}
              </p>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <button disabled={busy || !draft} onClick={() => void save()}>
              {busy ? "Saving…" : "Save flags"}
            </button>{" "}
            {draft && (
              <button className="secondary" onClick={() => setDraft(null)}>
                Discard changes
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

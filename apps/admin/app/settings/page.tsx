"use client";

import { useState } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/ui";
import Link from "next/link";

export default function SettingsPage() {
  const { data, error, loading, reload } = useLoad<Obj>(() => api<Obj>("/admin/settings"));
  const [jobCosts, setJobCosts] = useState<Record<string, number> | null>(null);
  const [threshold, setThreshold] = useState<string | null>(null);
  const [cap, setCap] = useState<string | null>(null);
  const [weightsStandard, setWeightsStandard] = useState("");
  const [weightsBrand, setWeightsBrand] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const costs = jobCosts ?? ((data?.jobCosts as Record<string, number> | undefined) ?? {});

  const save = async () => {
    setBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      const body: Obj = {
        jobCosts: costs,
        auditPassThreshold: Number(threshold ?? data?.auditPassThreshold ?? 70),
        concurrentJobCap: Number(cap ?? data?.concurrentJobCap ?? 3),
      };
      if (weightsStandard.trim()) body.auditWeightsStandard = JSON.parse(weightsStandard) as Obj;
      if (weightsBrand.trim()) body.auditWeightsBrand = JSON.parse(weightsBrand) as Obj;
      await api("/admin/settings", { method: "PUT", body });
      setActionOk("Settings saved. Changing the audit pass threshold affects new audits only.");
      setJobCosts(null);
      setThreshold(null);
      setCap(null);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>Platform Settings</h1>
      <p className="subtle">
        Platform defaults, versioned and logged with before/after values. Admin user management lives on the{" "}
        <Link href="/admin-users">Admin Users</Link> page. There is deliberately <strong>no</strong> setting for max
        niches / sub-niches / topics / questions — those are unlimited and fully dynamic.
      </p>
      <ErrorBox error={error ?? actionError} />
      {actionOk && <div className="ok-box">{actionOk}</div>}
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>General</h3>
            <div className="row">
              <label className="field" style={{ margin: 0 }}>
                <span>Audit pass threshold (0–100)</span>
                <input
                  type="number"
                  value={threshold ?? String(data?.auditPassThreshold ?? "")}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </label>
              <label className="field" style={{ margin: 0 }}>
                <span>Concurrent job cap (excess queues)</span>
                <input
                  type="number"
                  value={cap ?? String(data?.concurrentJobCap ?? "")}
                  onChange={(e) => setCap(e.target.value)}
                />
              </label>
            </div>
            <p className="subtle">The audit pass threshold applies to new audits only; historical audits keep the threshold and weights they ran with.</p>
          </div>

          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Job costs (credits per action)</h3>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(costs).map(([action, cost]) => (
                    <tr key={action}>
                      <td>
                        <code>{action}</code>
                      </td>
                      <td>
                        <input
                          type="number"
                          style={{ width: 120 }}
                          value={String(cost)}
                          onChange={(e) => setJobCosts({ ...costs, [action]: Number(e.target.value) })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Audit weights (A4 — optional)</h3>
            <p className="subtle">
              Weighted audit totals: per-area weights for the standard and Brand sets. Applicable weights must sum to
              exactly 100; N/A areas are excluded with proportional redistribution, and Editorial Depth is a verdict
              layer — never weighted. Leave blank to keep the current config; paste a full JSON object to replace it.
            </p>
            <label className="field">
              <span>Audit weights — standard (JSON)</span>
              <textarea rows={4} value={weightsStandard} onChange={(e) => setWeightsStandard(e.target.value)} placeholder='{"factualAccuracy":16,"sourceReliability":12,…}' spellCheck={false} />
            </label>
            <label className="field">
              <span>Audit weights — Brand (JSON)</span>
              <textarea rows={4} value={weightsBrand} onChange={(e) => setWeightsBrand(e.target.value)} placeholder='{"factualAccuracy":14,…,"brandCompliance":10}' spellCheck={false} />
            </label>
          </div>

          <button disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </>
      )}
    </main>
  );
}

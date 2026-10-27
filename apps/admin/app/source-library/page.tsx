"use client";

import { useState, type FormEvent } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { DataTable, ErrorBox, Loading } from "../../components/ui";
import RecordLibrary from "../../components/RecordLibrary";

type Tab = "entries" | "bundles" | "coverage" | "queue";

function BundlesTab() {
  const [bundleId, setBundleId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [nicheIds, setNicheIds] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const body: Obj = {};
      if (projectId.trim()) body.projectId = projectId.trim();
      if (nicheIds.trim()) body.nicheIds = nicheIds.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await api<Obj>(`/admin/source-bundles/${encodeURIComponent(bundleId)}/apply`, {
        method: "POST",
        body,
      });
      setOk(`Applied ${String(res.applied)} source entries from bundle ${bundleId}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <RecordLibrary
        title="Source Bundles"
        description="Named, reusable source sets for priority niches/topic clusters. A bundle must be marked reviewed (reviewed: true) before it can be applied to niches or projects — the API rejects unreviewed bundles with 422."
        basePath="/admin/source-bundles"
        keyField="id"
        columns={["id", "name", "reviewed", "status"]}
        newTemplate={{ name: "", entryIds: [], reviewed: false }}
      />
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Apply a bundle</h3>
        <ErrorBox error={error} />
        {ok && <div className="ok-box">{ok}</div>}
        <form onSubmit={apply}>
          <div className="row">
            <label className="field grow" style={{ margin: 0 }}>
              <span>Bundle ID</span>
              <input value={bundleId} onChange={(e) => setBundleId(e.target.value)} required />
            </label>
            <label className="field grow" style={{ margin: 0 }}>
              <span>Project ID (optional)</span>
              <input value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            </label>
            <label className="field grow" style={{ margin: 0 }}>
              <span>Niche IDs (optional, comma-separated)</span>
              <input value={nicheIds} onChange={(e) => setNicheIds(e.target.value)} />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Applying…" : "Apply bundle"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function CoverageTab() {
  const { data, error, loading, reload } = useLoad<Obj>(() => api<Obj>("/admin/niche-coverage"));
  const [nicheId, setNicheId] = useState("");
  const [status, setStatus] = useState("partial");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const coverage = (data?.coverage as Obj[] | undefined) ?? [];

  return (
    <main>
      <h2 style={{ marginTop: 0 }}>Niche coverage board</h2>
      <p className="subtle">
        Every niche shows <code>not_assessed | needs_sources | partial | ready</code>. <strong>Ready is a reviewed
        judgment</strong> (reviewer, date, note) — it is never derived from URL counts. Gap log entries recorded so
        far: {String(data?.gapCount ?? "—")}.
      </p>
      <ErrorBox error={error ?? actionError} />
      {actionOk && <div className="ok-box">{actionOk}</div>}
      {loading ? (
        <Loading />
      ) : (
        <DataTable
          rows={coverage}
          columns={["nicheId", "status", "reviewedBy", "reviewedAt", "note"]}
          emptyText="No coverage judgments recorded yet."
        />
      )}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Record a coverage judgment</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setActionError(null);
            setActionOk(null);
            try {
              await api(`/admin/niche-coverage/${encodeURIComponent(nicheId)}`, {
                method: "PATCH",
                body: { status, note },
              });
              setActionOk(`Coverage for niche ${nicheId} set to ${status}.`);
              reload();
            } catch (err) {
              setActionError(err instanceof Error ? err.message : String(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="row">
            <label className="field grow" style={{ margin: 0 }}>
              <span>Niche ID</span>
              <input value={nicheId} onChange={(e) => setNicheId(e.target.value)} required />
            </label>
            <label className="field" style={{ margin: 0 }}>
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="not_assessed">not_assessed</option>
                <option value="needs_sources">needs_sources</option>
                <option value="partial">partial</option>
                <option value="ready">ready</option>
              </select>
            </label>
            <label className="field grow" style={{ margin: 0 }}>
              <span>Note</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <button type="submit" disabled={busy}>
              Save judgment
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function QueueTab() {
  const { data, error, loading } = useLoad<Obj[]>(() => api<Obj[]>("/admin/source-review-queue"));
  return (
    <main>
      <h2 style={{ marginTop: 0 }}>Web-discovery review queue</h2>
      <p className="subtle">
        Library entries whose review status is <code>pending</code> — including sources promoted from web discovery in
        user runs. Edit an entry in the Entries tab to set its credibility tier (1–5, or unassessed) and review
        decision (approved / blocked). Promoting or blocking here is platform-wide; project-level approval stays with
        the project owner.
      </p>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : (
        <DataTable
          rows={data ?? []}
          columns={["id", "name", "url", "kind", "credibilityTier", "availability", "reviewStatus"]}
          emptyText="Review queue is empty."
        />
      )}
    </main>
  );
}

export default function SourceLibraryPage() {
  const [tab, setTab] = useState<Tab>("entries");
  return (
    <main>
      <h1>Source Library</h1>
      <p className="subtle">
        Research is curated sources first (A1). Entries carry three separate fields: credibility tier (1–5 or
        unassessed), availability (enabled / disabled / inaccessible) and review status (approved / pending / blocked).
        Research modes: <code>curated_first</code> (default — the user is asked before any web search, never silent),{" "}
        <code>curated_only</code>, <code>web_only</code>, <code>selected_only</code>.
      </p>
      <div className="tabs">
        <button className={tab === "entries" ? "active" : undefined} onClick={() => setTab("entries")}>Entries</button>
        <button className={tab === "bundles" ? "active" : undefined} onClick={() => setTab("bundles")}>Bundles</button>
        <button className={tab === "coverage" ? "active" : undefined} onClick={() => setTab("coverage")}>Coverage</button>
        <button className={tab === "queue" ? "active" : undefined} onClick={() => setTab("queue")}>Review Queue</button>
      </div>
      <div style={{ marginTop: 16 }}>
        {tab === "entries" && (
          <RecordLibrary
            title="Library Entries"
            description="Curated research sources: name, URL, kind (incl. scripture / translation / commentary), language, author, publisher, edition, scope, category/niche links, tags, credibility tier, availability, review status. Entries flagged needs_tier_review were migrated without an assessed tier."
            basePath="/admin/source-library"
            keyField="id"
            columns={["id", "name", "kind", "credibilityTier", "availability", "reviewStatus", "status"]}
            newTemplate={{ name: "", url: "", kind: "site", reviewStatus: "pending", availability: "enabled" }}
          />
        )}
        {tab === "bundles" && <BundlesTab />}
        {tab === "coverage" && <CoverageTab />}
        {tab === "queue" && <QueueTab />}
      </div>
    </main>
  );
}

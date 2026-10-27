"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Obj } from "../lib/api";
import { DataTable, ErrorBox, Loading } from "../components/ui";

interface Section<T> {
  data: T | null;
  error: string | null;
}

function useSection<T>(path: string): Section<T> {
  const [state, setState] = useState<Section<T>>({ data: null, error: null });
  useEffect(() => {
    let live = true;
    api<T>(path)
      .then((d) => live && setState({ data: d, error: null }))
      .catch((e: unknown) => live && setState({ data: null, error: e instanceof Error ? e.message : String(e) }));
    return () => {
      live = false;
    };
  }, [path]);
  return state;
}

const QUICK_LINKS: Array<{ href: string; label: string; blurb: string }> = [
  { href: "/taxonomy", label: "Taxonomy", blurb: "Categories, niches, sub-niches" },
  { href: "/config-questions", label: "Config Questions", blurb: "Dynamic question builder + niche assignments" },
  { href: "/angles", label: "Angles", blurb: "Per-niche angles; complete title-only entries" },
  { href: "/model-providers", label: "Model Providers", blurb: "Providers, stage assignments, thresholds" },
  { href: "/source-library", label: "Source Library", blurb: "Curated sources, bundles, coverage" },
  { href: "/seeds", label: "Seeds", blurb: "Run seed imports, review reports" },
  { href: "/jobs", label: "Jobs", blurb: "Generation job oversight" },
  { href: "/safety", label: "Safety Queue", blurb: "Research gaps & data-viz requests" },
];

export default function DashboardPage() {
  const users = useSection<Obj[]>("/admin/users");
  const seeds = useSection<Obj[]>("/admin/seeds");
  const jobs = useSection<Obj[]>("/admin/jobs");
  const flags = useSection<Obj>("/admin/feature-flags");
  const safety = useSection<Obj>("/admin/safety-queue");
  const audit = useSection<Obj[]>("/admin/audit-log");

  const seedRecords = (seeds.data ?? []).reduce((n, s) => n + Number(s.importedRecords ?? 0), 0);
  const failedJobs = (jobs.data ?? []).filter((j) => j.status === "failed").length;
  const runningJobs = (jobs.data ?? []).filter((j) => j.status === "running" || j.status === "queued").length;
  const flagsOn = flags.data ? Object.values(flags.data).filter(Boolean).length : null;

  return (
    <main>
      <h1>Dashboard</h1>
      <p className="subtle">Platform overview. Each card loads independently — a failed source shows its own error, never a fake zero.</p>

      <div className="cards">
        <div className="card">
          <div className="label">Users</div>
          <div className="num">{users.data ? users.data.length : "—"}</div>
          <ErrorBox error={users.error} />
          <Link href="/users">Manage users →</Link>
        </div>
        <div className="card">
          <div className="label">Seed records imported</div>
          <div className="num">{seeds.data ? seedRecords.toLocaleString() : "—"}</div>
          <small>{seeds.data ? `${seeds.data.length} seed files` : ""}</small>
          <ErrorBox error={seeds.error} />
          <br />
          <Link href="/seeds">Seed imports →</Link>
        </div>
        <div className="card">
          <div className="label">Jobs (recent 100)</div>
          <div className="num">{jobs.data ? jobs.data.length : "—"}</div>
          <small>
            {jobs.data ? `${runningJobs} queued/running · ${failedJobs} failed` : ""}
          </small>
          <ErrorBox error={jobs.error} />
          <br />
          <Link href="/jobs">Job oversight →</Link>
        </div>
        <div className="card">
          <div className="label">Feature flags on</div>
          <div className="num">{flagsOn ?? "—"}</div>
          <small>{flags.data ? `of ${Object.keys(flags.data).length} flags` : ""}</small>
          <ErrorBox error={flags.error} />
          <br />
          <Link href="/feature-flags">Feature flags →</Link>
        </div>
        <div className="card">
          <div className="label">Safety queue</div>
          <div className="num">
            {safety.data ? Number(safety.data.researchGaps ?? 0) + Number(safety.data.dataVizRequests ?? 0) : "—"}
          </div>
          <small>
            {safety.data
              ? `${String(safety.data.researchGaps ?? 0)} research gaps · ${String(safety.data.dataVizRequests ?? 0)} data-viz requests`
              : ""}
          </small>
          <ErrorBox error={safety.error} />
          <br />
          <Link href="/safety">Safety queue →</Link>
        </div>
      </div>

      <h2>Quick links</h2>
      <div className="cards">
        {QUICK_LINKS.map((l) => (
          <div className="card" key={l.href}>
            <strong>
              <Link href={l.href}>{l.label}</Link>
            </strong>
            <p className="subtle" style={{ margin: "6px 0 0" }}>{l.blurb}</p>
          </div>
        ))}
      </div>

      <h2>Recent admin activity</h2>
      <ErrorBox error={audit.error} />
      {audit.data === null && !audit.error ? (
        <Loading />
      ) : (
        <DataTable
          rows={(audit.data ?? []).slice(0, 8)}
          columns={["actor", "action", "target", "at"]}
          emptyText="No admin actions recorded yet."
        />
      )}
    </main>
  );
}

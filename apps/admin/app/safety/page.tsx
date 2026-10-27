"use client";

import { api, useLoad, type Obj } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/ui";

export default function SafetyPage() {
  const { data, error, loading } = useLoad<Obj>(() => api<Obj>("/admin/safety-queue"));

  return (
    <main>
      <h1>Content Safety Queue</h1>
      <p className="subtle">
        Flagged work needing platform review: research gaps (insufficient-evidence outcomes recorded during Step 7)
        and unsupported chart-type requests (<code>dataVizRequest</code>) raised by scenes. Admins can review context
        and contact the user — an admin never rewrites a user&apos;s claim to “verified”; only the Research/Audit flow
        can verify (Control Rule 9), and only a new user-approved revision clears a user&apos;s flag.
      </p>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : (
        <div className="cards">
          <div className="card">
            <div className="label">Research gaps</div>
            <div className="num">{String(data?.researchGaps ?? 0)}</div>
            <small>Feed these into Source Library curation — coverage follows the gaps users actually hit.</small>
          </div>
          <div className="card">
            <div className="label">Data-viz requests</div>
            <div className="num">{String(data?.dataVizRequests ?? 0)}</div>
            <small>
              Scenes that requested a chart type outside the versioned vocabulary. Add the type to the Data
              Visualization annex template — never substitute another type silently.
            </small>
          </div>
        </div>
      )}
      <div className="warn-box">
        The current API returns aggregate counts for this queue. Item-level context (run/project, exact scene/claim,
        audit evidence, source trace) is not yet exposed by an endpoint — see the build report&apos;s API gaps.
      </div>
    </main>
  );
}

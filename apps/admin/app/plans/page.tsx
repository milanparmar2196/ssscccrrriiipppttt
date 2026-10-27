"use client";

import RecordLibrary from "../../components/RecordLibrary";

export default function PlansPage() {
  return (
    <RecordLibrary
      title="Plans"
      description="Plans are internal entitlements managed here only — there is no billing provider, no checkout and nothing is sold in-app. Any price shown is a reference value. Changing a plan does not retro-change existing members unless a logged migration is run."
      basePath="/admin/plans"
      keyField="key"
      columns={["key", "name", "includedCredits", "status", "_version"]}
      newTemplate={{ name: "", includedCredits: 0 }}
      note="Plans must NOT cap projects, runs, niches, sub-niches, topics or questions — the platform is fully dynamic with no limits."
    />
  );
}

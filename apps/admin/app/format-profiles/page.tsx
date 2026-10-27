"use client";

import RecordLibrary from "../../components/RecordLibrary";

export default function FormatProfilesPage() {
  return (
    <RecordLibrary
      title="Output Format Profiles"
      description="Per-tool script format rules that Production Package handoffs render through: toolType (video|audio|image|edit), textStyle (plain|markdown|ssml|structured_fields), separator, speaker label style, blank lines between scenes, per-unit character caps, clip duration caps, and the ordered fields list. The profile is chosen per run (default from the run's asset-method answer) and validated before a Package is marked ready."
      basePath="/admin/format-profiles"
      keyField="key"
      columns={["key", "name", "toolType", "textStyle", "status", "_version"]}
      newTemplate={{ name: "", toolType: "video", textStyle: "plain", fields: [] }}
    />
  );
}

"use client";

import RecordLibrary from "../../components/RecordLibrary";

export default function AnnexTemplatesPage() {
  return (
    <RecordLibrary
      title="Bible Annex Templates"
      description="Annexes are the niche-dependent extra Bible sections (the 14 core sections are the same for all projects). Built-ins include monetizationSponsor and accessibility (any niche), character (person-based niches — portrayal rules and invented-dialogue policy only; character data lives in the project's Character Registry), and dataVisualization (carries the versioned chart-type vocabulary for dataVizSpec). A project only ever sees its active annexes."
      basePath="/admin/annex-templates"
      keyField="key"
      columns={["key", "name", "status", "_version"]}
      newTemplate={{ name: "", fields: [] }}
    />
  );
}

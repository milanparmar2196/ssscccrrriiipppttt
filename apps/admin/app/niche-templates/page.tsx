"use client";

import RecordLibrary from "../../components/RecordLibrary";

export default function NicheTemplatesPage() {
  return (
    <RecordLibrary
      title="Niche Templates"
      description="Reusable, versioned per-niche bundles: Strategy Defaults, Configuration Defaults, Production Bible Template, Questions Set, Research Template, Structure Templates, Scene Template, Audit Add-ons, Packaging Defaults, and the Registries section (10th). The Registries section is either null (Inherit — resolve from per-niche override, else the category map) or { mode: 'explicit', primary, secondary: [] } — an empty secondary list is an intentional choice, not the same as Inherit. Applying a template snapshots it into the project; template updates never silently overwrite a project."
      basePath="/admin/niche-templates"
      keyField="id"
      columns={["id", "name", "nicheId", "isDefault", "scope", "status"]}
      newTemplate={{ name: "", nicheId: "", isDefault: false, scope: "global", sections: {} }}
    />
  );
}

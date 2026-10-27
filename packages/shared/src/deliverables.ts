/**
 * PACKAGE_DELIVERABLES — the single canonical definition of Production
 * Package contents (A11). API, Web, the package builder and all docs
 * reference this list; none maintains its own. The package builder
 * validates every requested/built key against it (unknown key = build
 * error). Keys are immutable once shipped: a rename ships as a new key
 * plus a PACKAGE_DELIVERABLE_ALIASES entry; existing packages keep the
 * manifest they were generated with (manifests are snapshots).
 */

export type PackageDeliverableKind = "file" | "record" | "both";

export interface PackageDeliverable {
  key: string;
  label: string;
  kind: PackageDeliverableKind;
  /** "core" = always built, cannot be deselected. Otherwise the condition. */
  inclusion: string;
  origin: string;
}

export const PACKAGE_DELIVERABLES: readonly PackageDeliverable[] = [
  { key: "finalScript", label: "Final Script", kind: "file", inclusion: "core", origin: "WORKFLOW Step 14" },
  { key: "sceneBreakdown", label: "Scene Breakdown (DOCX/PDF + CSV)", kind: "file", inclusion: "core", origin: "WORKFLOW Step 14" },
  { key: "productionChecklist", label: "Production Checklist", kind: "file", inclusion: "core", origin: "WORKFLOW Step 14" },
  { key: "projectSummary", label: "Project Summary (front sheet)", kind: "file", inclusion: "core", origin: "Phase 4 adoption A5" },
  { key: "completionCertificate", label: "Completion Certificate", kind: "both", inclusion: "core", origin: "Phase 5 adoption (issued at Final Approval)" },
  { key: "generatorProfile", label: "Generator Profile", kind: "record", inclusion: "core", origin: "Phase 2 G10 (run snapshot)" },
  { key: "voInstructions", label: "VO Instructions", kind: "file", inclusion: "required set", origin: "WORKFLOW Step 14" },
  { key: "visualRequirements", label: "Visual Requirements", kind: "file", inclusion: "required set", origin: "WORKFLOW Step 14" },
  { key: "aiPrompts", label: "AI Prompts", kind: "file", inclusion: "when the run's production method uses AI-generated assets", origin: "WORKFLOW Step 14" },
  { key: "shotDirections", label: "Shot Directions", kind: "file", inclusion: "required set", origin: "WORKFLOW Step 14" },
  { key: "musicSfxCues", label: "Music & SFX Cues", kind: "file", inclusion: "required set", origin: "WORKFLOW Step 14" },
  { key: "onScreenTextGraphics", label: "On-Screen Text & Graphics", kind: "file", inclusion: "required set", origin: "WORKFLOW Step 14" },
  { key: "captionsSubtitles", label: "Captions & Subtitles", kind: "file", inclusion: "required set; MVP = narration caption text + timing plan, timed SRT/VTT later (Q7)", origin: "WORKFLOW Step 14 + Q7" },
  { key: "titleSuggestions", label: "Title Suggestions", kind: "file", inclusion: "required set", origin: "WORKFLOW Step 14" },
  { key: "thumbnailConcepts", label: "Thumbnail Concepts (text)", kind: "file", inclusion: "required set", origin: "WORKFLOW Step 14" },
  { key: "descriptionMetadata", label: "Description & Metadata", kind: "file", inclusion: "required set (incl. Monetization disclosure checklist when that annex is active)", origin: "WORKFLOW Step 14" },
  { key: "researchReferences", label: "Research References", kind: "file", inclusion: "required set (citations by scene + bibliography by credibility tier)", origin: "WORKFLOW Step 14 + Phase 4 A3" },
  { key: "editingInstructions", label: "Editing Instructions", kind: "file", inclusion: "required set", origin: "WORKFLOW Step 14" },
  { key: "entityReferenceSheet", label: "Entity Reference Sheet", kind: "file", inclusion: "when the run used registry entities", origin: "Phase 4 adoption A1" },
  { key: "legalReviewSummary", label: "Legal Review Summary", kind: "file", inclusion: "when the run carries legal flags / high-risk claims", origin: "Phase 4 adoption A2" },
  { key: "viewerGlossary", label: "Viewer Glossary", kind: "file", inclusion: "when the run used Bible section 10 glossary entries", origin: "Phase 2 G10" },
] as const;

/** Renamed keys -> current key. Existing manifests are never rewritten. */
export const PACKAGE_DELIVERABLE_ALIASES: Readonly<Record<string, string>> = {};

export const PACKAGE_DELIVERABLE_KEYS: readonly string[] = PACKAGE_DELIVERABLES.map(
  (d) => d.key,
);

export function isPackageDeliverableKey(key: string): boolean {
  return PACKAGE_DELIVERABLE_KEYS.includes(key);
}

export function resolvePackageDeliverableKey(key: string): string | undefined {
  if (isPackageDeliverableKey(key)) return key;
  const target = PACKAGE_DELIVERABLE_ALIASES[key];
  return target && isPackageDeliverableKey(target) ? target : undefined;
}

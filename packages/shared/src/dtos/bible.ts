/**
 * Production Bible DTOs (Shared SPEC §2): the canonical 14 sections,
 * niche annexes, the 7 Master Lists, and the 11 registries.
 * Character data's canonical living home is the Character Registry
 * (A12); the Bible character annex holds portrayal rules only, and
 * every locked Bible version carries an immutable characterSnapshot.
 */
import type { BaseEntity, VersionedEntity } from "./core.js";
import type { BibleMasterListKey, RegistryType } from "../enums.js";

/** The canonical 14 Bible section keys (API Spec §5). */
export const BIBLE_SECTION_KEYS = [
  "channelPromise",
  "audiencePersona",
  "toneBible",
  "languageBible",
  "visualBible",
  "structureBible",
  "packagingBible",
  "complianceBible",
  "voiceNarrationBible",
  "glossaryPronunciation",
  "musicSoundBible",
  "seriesContinuityBible",
  "researchEvidenceStandards",
  "performanceLearningsLog",
] as const;
export type BibleSectionKey = (typeof BIBLE_SECTION_KEYS)[number];

export type BibleSections = Partial<Record<BibleSectionKey, Record<string, unknown>>>;

/** Built-in annex keys; niche-created subject annex keys are data, not an enum. */
export const BUILTIN_ANNEX_KEYS = [
  "monetizationSponsor",
  "accessibility",
  "character",
] as const;

export interface AnnexFieldDefinition {
  key: string;
  label: string;
  type: "text" | "long_text" | "number" | "boolean" | "choice" | "list" | "record";
  required?: boolean;
  options?: string[];
}

export interface AnnexTemplate extends VersionedEntity {
  key: string; // e.g. monetizationSponsor, accessibility, character, or a subject key
  label: string;
  fields: AnnexFieldDefinition[];
}

export interface BibleAnnex {
  key: string;
  templateVersion: number;
  values: Record<string, unknown>;
}

/** Immutable copy of every Character Registry entry at lock time (A12). */
export interface CharacterSnapshot {
  capturedAt: string;
  entries: Array<{ entryId: string; entryVersion: number; data: CharacterEntry }>;
}

export interface ProductionBible extends VersionedEntity {
  projectId: string;
  sections: BibleSections;
  annexes: BibleAnnex[];
  /** Present only when the project's registry set includes character. */
  characterSnapshot?: CharacterSnapshot;
  lockedAt?: string | null;
}

/** ---- Master Lists: living project-level registries, not version-locked ---- */

export interface MasterSourceEntry extends BaseEntity {
  listKey: "sourceList";
  title: string;
  url?: string;
  status: "approved" | "blocked";
  note?: string;
}

export interface DoNotRepeatEntry extends BaseEntity {
  listKey: "doNotRepeat";
  kind: "topic" | "story" | "angle" | "hook" | "opening" | "example";
  summary: string;
  runId?: string; // source run; entries from deleted runs remain, marked
  sourceDeletedRun?: boolean;
}

export interface MasterTimelineEntry extends BaseEntity {
  listKey: "masterTimeline";
  label: string;
  dateOrRange: string;
  note?: string;
}

export interface LocationSettingEntry extends BaseEntity {
  listKey: "locationSettings";
  name: string;
  /** Locked visual description, reused like a character's appearance. */
  lockedVisualDescription: string;
}

export interface HookOpeningEntry extends BaseEntity {
  listKey: "hookOpeningLibrary";
  text: string;
  status: "approved" | "testing" | "archived";
}

export interface PhraseBankEntry extends BaseEntity {
  listKey: "phraseBank";
  kind: "transition" | "segment_intro" | "catchphrase" | "cta" | "closing" | "disclaimer";
  text: string;
}

export interface AssetSourceEntry extends BaseEntity {
  listKey: "assetSourceList";
  name: string;
  kind: "music" | "sfx" | "stock" | "font" | "other";
  licenseNote: string;
  status: "approved" | "blocked";
}

export type BibleMasterListEntry =
  | MasterSourceEntry
  | DoNotRepeatEntry
  | MasterTimelineEntry
  | LocationSettingEntry
  | HookOpeningEntry
  | PhraseBankEntry
  | AssetSourceEntry;

export type { BibleMasterListKey };

/** ---- Registries: entities (Annexes are rules; Registries are entities) ---- */

export interface RegistryModule extends BaseEntity {
  projectId: string;
  registryType: RegistryType;
  annexHome?: string; // annex key when the registry lives inside an annex
}

export interface RegistryEntryBase extends BaseEntity {
  registryType: RegistryType;
  entryVersion: number;
}

/** Type 1 — Character (canonical shape, REGISTRY_MAP + A12). */
export interface CharacterEntry extends RegistryEntryBase {
  registryType: "character";
  name: string;
  aliases: string[];
  role: "main" | "supporting" | "recurring";
  era?: string;
  identitySummary: string;
  traits: string[];
  motivations: string[];
  relationships: Array<{ characterRef: string; relation: string }>;
  lifeTimeline: Array<{ label: string; dateOrRange: string; note?: string }>;
  lockedAppearanceDescription: string;
  imagePromptSuffix: string;
  variants: Array<{ key: string; description: string }>;
  designStatus: "draft" | "approved" | "locked";
  negativePrompt?: string;
  portrayalNotes?: string;
  sensitivityNotes?: string;
  dialoguePolicyRef?: string;
}

/** Type 2 — Place. Crops/reverse angles are views, never new entries. */
export interface PlaceEntry extends RegistryEntryBase {
  registryType: "place";
  name: string;
  canonicalName: string;
  localName?: string;
  pronunciation?: string;
  hierarchy?: string;
  placeType: "city" | "region" | "site" | "natural" | "celestial" | "fictional-ref";
  eraContext?: string;
  lockedVisualDescription: string;
  keyFacts: string[];
  cameraGeography?: string;
}

/** Type 3 — Knowledge & Ingredient (two variants + Recipe + Verified Data). */
export interface KnowledgeEntry extends RegistryEntryBase {
  registryType: "knowledge";
  variant: "ingredient" | "topic" | "recipe" | "verifiedData";
  name: string;
  lockedDefinition: string;
  keyFacts: string[];
  safetyNotes?: string;
  reviewDate?: string;
  reviewBy?: string;
  /** Verified Data variant carries: methodologyNote, verifiedOn, reviewBy. */
  methodologyNote?: string;
  verifiedOn?: string;
}

/** Type 4 — Case / Event. */
export interface CaseEventEntry extends RegistryEntryBase {
  registryType: "caseEvent";
  name: string;
  dateOrRange: string;
  placeRefs: string[];
  personRefs: string[];
  verifiedSummary: string;
  openQuestions: string[];
}

/** Type 5 — Creature. */
export interface CreatureEntry extends RegistryEntryBase {
  registryType: "creature";
  commonName: string;
  scientificName?: string;
  aliases: string[];
  habitatPlaceRefs: string[];
  lockedAppearanceDescription: string;
  keyFacts: string[];
}

/** Type 6 — Story-World. */
export interface StoryWorldEntry extends RegistryEntryBase {
  registryType: "storyWorld";
  worldName: string;
  premise: string;
  worldRules: string[];
  characterRefs: string[];
  placeRefs: string[];
}

/** Type 7 — Organisation. */
export interface OrganisationEntry extends RegistryEntryBase {
  registryType: "organisation";
  name: string;
  orgType: "company" | "institution" | "team" | "state" | "publication";
  keyFacts: string[];
  lockedVisualDescription?: string;
}

/** Type 8 — Product. Prices are always dated (addendum fields). */
export interface ProductEntry extends RegistryEntryBase {
  registryType: "product";
  name: string;
  makerOrgRef?: string;
  category: string;
  launchOrPeriod?: string;
  lockedSpecs: Record<string, string>;
  lockedVisualDescription: string;
  commonErrors: string[];
  priceAsOf?: string;
  priceNote?: string;
}

/** Type 9 — Concept. beliefLabel marks belief content (never stated as fact). */
export interface ConceptEntry extends RegistryEntryBase {
  registryType: "concept";
  concept: string;
  lockedDefinition: string;
  relatedConceptRefs: string[];
  terminologyRules?: string;
  beliefLabel?: boolean;
}

/** Type 10 — Work. */
export interface WorkEntry extends RegistryEntryBase {
  registryType: "work";
  title: string;
  workType: "film" | "series" | "book" | "match" | "song" | "game" | "text";
  keyFacts: string[];
  spoilerPolicy?: string;
  rightsNote?: string; // e.g. summarise-only
}

/** Type 11 — Props & Wardrobe (own DTO per A3; per-scene state table). */
export interface PropsWardrobeEntry extends RegistryEntryBase {
  registryType: "propsWardrobe";
  name: string;
  kind: "prop" | "wardrobe";
  lockedVisualDescription: string;
  stateTable: Array<{ sceneRef: string; state: string; note?: string }>;
}

export type RegistryEntry =
  | CharacterEntry
  | PlaceEntry
  | KnowledgeEntry
  | CaseEventEntry
  | CreatureEntry
  | StoryWorldEntry
  | OrganisationEntry
  | ProductEntry
  | ConceptEntry
  | WorkEntry
  | PropsWardrobeEntry;

/**
 * Angle — first-class object on the niche (REGISTRY_MAP).
 * Imported angles (ANGLES_MASTER.md seed) are TITLE-ONLY: the source
 * file carries titles only, so question/scope/evidence/boundary stay
 * unset — never generated or assumed. `completeness` flips to
 * "complete" only when an admin has filled all four fields. AI draft
 * suggestions live in `suggestedFields`, clearly labelled, and never
 * copy themselves into the real fields (an admin applies them by
 * editing, which is a human act).
 */
export interface Angle extends BaseEntity {
  nicheId: string; // taxonomy record id (niche or sub-niche)
  slug: string; // unique per niche
  angle: string;
  question?: string;
  scope?: string;
  evidence?: string;
  boundary?: string;
  completeness: "title_only" | "complete";
  sourceRef?: string; // provenance, e.g. "ANGLES_MASTER.md section 042"
  suggestedFields?: {
    question?: string;
    scope?: string;
    evidence?: string;
    boundary?: string;
    status: "draft"; // always a draft; never approved guidance
    modelRef?: string;
  };
  archivedAt?: string | null;
}

/** ---- Visual style system (16 archetypes, 10-field schema, D5) ---- */

export const VISUAL_ARCHETYPE_FIELDS = [
  "visualLanguage",
  "palette",
  "lighting",
  "cameraLens",
  "motion",
  "texture",
  "graphics",
  "thumbnail",
  "aiPromptKeywords",
  "avoid",
] as const;
export type VisualArchetypeField = (typeof VISUAL_ARCHETYPE_FIELDS)[number];

export interface VisualArchetype extends VersionedEntity {
  key: string; // A1..A16 are the seed set; Admin may add more (dynamic)
  name: string;
  fields: Record<VisualArchetypeField, string>;
}

export type VisualFieldSourceKind =
  | "primary"
  | "secondary"
  | "union"
  | "project_override"
  | "default";

export interface VisualStyleAssignment {
  archetypeId?: string;
  archetypeVersion?: number;
  primaryArchetypeId?: string;
  secondaryArchetypeId?: string;
  overrides?: Partial<Record<VisualArchetypeField, string>>;
  fieldSources?: Partial<
    Record<VisualArchetypeField, { source: VisualFieldSourceKind; archetypeId?: string }>
  >;
}

/** ---- Output format profiles (docs/OUTPUT_FORMAT_PROFILES.md) ---- */

export interface OutputFormatProfile extends VersionedEntity {
  key: string;
  label: string;
  toolType: "video" | "audio" | "image" | "edit";
  textStyle: "plain" | "markdown" | "ssml" | "structured_fields";
  separator: string;
  speakerLabelStyle: string;
  blankLinesBetweenScenes: number;
  maxCharsPerUnit?: number;
  clipDurationCapSec?: number;
  fields: string[]; // ordered field keys rendered per unit
}

/** Shot Recipe Library (Phase 2 G-addition; SHOT_ ids). */
export interface ShotRecipe extends BaseEntity {
  key: string; // SHOT_...
  label: string;
  shotType: string;
  cameraMove: string;
  composition: string;
  note?: string;
  archivedAt?: string | null;
}

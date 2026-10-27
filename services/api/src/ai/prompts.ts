/**
 * Server-side prompt templates (API §10: generation prompts are
 * server-side templates; user content is DATA in the user message,
 * never concatenated into a system prompt). Admin prompt-template
 * records (library kind "prompt_template", keyed by stage) override
 * these defaults when present.
 */
import type { ChatMessage } from "./client.js";
import type { PlatformStore } from "../platform/store.js";

const BASE_RULES = `You are a script-generation engine for faceless video content.
Rules: never invent sources, quotations, statistics or claims; where evidence is
missing, say so explicitly in the output structure. Output ONLY the JSON asked for.`;

const DEFAULTS: Record<string, string> = {
  bible_generate: `${BASE_RULES}
Produce a Production Bible as JSON with the 14 canonical section keys:
channelPromise, audiencePersona, toneBible, languageBible, visualBible,
structureBible, packagingBible, complianceBible, voiceNarrationBible,
glossaryPronunciation, musicSoundBible, seriesContinuityBible,
researchEvidenceStandards, performanceLearningsLog. Each value is an object
with a "text" field (and extra structured fields where natural).`,
  topic_generate: `${BASE_RULES}
Generate video topics as JSON: {"topics":[{"title","angle","hook","storyQuestion"}]}.
Respect the niche, sub-niche, selected angle and the do-not-repeat list.`,
  topic_evaluate: `${BASE_RULES}
Score each topic as JSON: {"scores":{"audienceInterest","originality",
"storytellingPotential","researchFeasibility","relevance","productionRequirements",
"visualFeasibility"}} with 0-10 numbers and a one-line rationale per topic.`,
  research_run: `${BASE_RULES}
Build a research brief as JSON: {"summary":{"storyInBrief","whyNow","centralQuestion",
"keyTurningPoints":[],"legalEthicalFlags":[]}, "claims":[{"text","status",
"sourceIds":[],"sourceLocation","confidence","riskLevel"}], "timeline":[],
"entities":[], "statistics":[], "examples":[], "hookMaterial":"",
"visualMaterial":[], "conflicts":[], "lowResearchWarning": false}.
Use ONLY the fetched source passages provided. A claim may be verified_fact only
with one tier-1 source or two independent credible sources behind it.`,
  outline_generate: `${BASE_RULES}
Produce an outline as JSON: {"sections":[{"key","title","purpose","keyPoints":[],
"claimIds":[]}]} using section keys hook|intro|setup|development|conflict|
revelation|transition|climax|conclusion|cta. Cover every approved claim's beat.`,
  script_generate: `${BASE_RULES}
Write narration for the given outline section as JSON: {"narration":"..."}.
Narration-led pacing from the Bible; define the visuals in text is the scene
stage's job — focus on spoken words here.`,
  scene_generate: `${BASE_RULES}
Break the script section into scenes as JSON: {"scenes":[{"purpose","narration",
"speakerLabel","visualDirection","shotDescription","shotType","cameraMove",
"onScreenText","claimIds":[],"legalRiskFlag","retentionNote"}]}.
Every scene MUST have a specific visualDirection — a scene without a visual is
incomplete. onScreenText must always be present (use "none" for an explicit
no-text decision).`,
  audit_run: `${BASE_RULES}
You are a skeptical, independent auditor. Unverifiable = fail. Score each area
0-10 as JSON: {"areas":{"factualAccuracy":0,...}, "checks":[{"area","key",
"status","message","suggestion","sceneNos":[]}]}. Fixes only — no enhancements.`,
  audit_autofix: `${BASE_RULES}
Rewrite ONLY the given scenes/sections to fix the named audit failures.
Return JSON in the same shape as the input items.`,
  asset_research: `${BASE_RULES}
For each scene, propose production assets as JSON: {"assets":[{"sceneNo","type",
"description","sourceNote","licenseStatus"}]}. Never label AI imagery as
archival footage or documentary evidence.`,
  publishing_generate: `${BASE_RULES}
Produce publishing outputs as JSON: {"titles":[],"description":"",
"thumbnailBriefs":[],"chapters":[],"subtitlesPlan":"","tags":[],"pinnedComment":"",
"recommendations":[]}. Title under 100 chars with the primary keyword; 15-20 tags.`,
  insights_generate: `${BASE_RULES}
Analyse performance records as JSON: {"insights":[{"text","kind"}],
"proposedBibleEdits":[{"sectionKey","changeSummary","rationale","evidenceRefs":[]}]}.
Proposed Bible edits are proposals only — never state them as applied.`,
};

export async function stageMessages(
  platform: PlatformStore,
  stage: string,
  context: Record<string, unknown>,
): Promise<ChatMessage[]> {
  const override = await platform.getLibraryRecord("prompt_template", stage);
  const system =
    (override?.payload as { system?: string } | undefined)?.system ?? DEFAULTS[stage] ?? BASE_RULES;
  return [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(context, null, 2) },
  ];
}

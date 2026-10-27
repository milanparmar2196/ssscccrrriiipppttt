/**
 * Read-only sample project (D2): a complete topic -> research ->
 * Bible -> scenes -> audit -> package journey, SAMPLE-labelled.
 * Created once by the platform; duplicated explicitly by users.
 */
import { BIBLE_SECTION_KEYS } from "@scriptwriter/shared";
import type { AppDeps } from "../deps.js";

type Obj = Record<string, unknown>;
const SAMPLE_OWNER = "platform";

export async function ensureSampleProject(deps: AppDeps): Promise<string | undefined> {
  const platform = deps.platform;
  const existing = await platform.listProjects(SAMPLE_OWNER, { includeSample: true });
  const sample = existing.find((p) => p.isSample);
  if (sample) return sample.id;

  const project = await platform.createProject({
    ownerId: SAMPLE_OWNER,
    type: "personal",
    name: "SAMPLE — The Forgotten Library of Alexandria",
    platform: "youtube_long",
    lifecycleStatus: "active",
    isSample: true,
    data: { settings: { sceneReviewMode: "auto" } },
  });
  await platform.createArtifact({
    kind: "project_niche", ownerId: SAMPLE_OWNER, projectId: project.id,
    key: "history", versionNo: 1, isCurrent: true,
    data: { id: "history-niche", name: "History", source: "preset", categoryKey: "history_civilisation" },
  });
  await platform.createArtifact({
    kind: "audience_strategy", ownerId: SAMPLE_OWNER, projectId: project.id,
    versionNo: 1, isCurrent: true,
    data: { audience: "Curious adults 25-44", promise: "One forgotten story, fully evidenced, every week" },
  });
  const sections: Obj = {};
  for (const key of BIBLE_SECTION_KEYS) sections[key] = { text: `Sample ${key} section.` };
  sections.channelPromise = { text: "Forgotten history, told only from verified sources." };
  const bible = await platform.createArtifact({
    kind: "bible_version", ownerId: SAMPLE_OWNER, projectId: project.id,
    versionNo: 1, isCurrent: true, status: "approved", data: sections,
  });
  const run = await platform.createRun({
    projectId: project.id,
    ownerId: SAMPLE_OWNER,
    title: "How the Library of Alexandria Really Vanished",
    lifecycleStatus: "active",
    stageMap: {
      topics: "done", config: "done", research: "done", outline: "done",
      script: "done", scenes: "done", audit: "done", package: "done",
      performance: "ready", assets: "locked", publishing: "locked",
    },
    stageHistory: [],
    selectedTopicId: "sample-topic",
    snapshots: {
      bibleVersion: bible.versionNo,
      topicTitle: "How the Library of Alexandria Really Vanished",
      storyQuestion: "Who actually destroyed the Library — and does the evidence agree?",
    },
    openIssues: [],
    data: {},
  });
  await platform.createArtifact({
    kind: "topic", ownerId: SAMPLE_OWNER, projectId: project.id, runId: run.id,
    versionNo: 1, isCurrent: true, status: "selected",
    data: { title: "How the Library of Alexandria Really Vanished", angle: "Evidence vs myth", totalScore: 8.7 },
  });
  await platform.createArtifact({
    kind: "research_brief", ownerId: SAMPLE_OWNER, projectId: project.id, runId: run.id,
    versionNo: 1, isCurrent: true, status: "approved",
    data: {
      summary: {
        storyInBrief: "No single fire destroyed the Library; it declined over centuries.",
        centralQuestion: "Who actually destroyed the Library — and does the evidence agree?",
        keyTurningPoints: ["Caesar's harbour fire (48 BCE)", "The Serapeum destruction (391 CE)"],
        legalEthicalFlags: [],
      },
    },
  });
  await platform.createArtifact({
    kind: "script", ownerId: SAMPLE_OWNER, projectId: project.id, runId: run.id,
    versionNo: 1, isCurrent: true, status: "approved",
    data: {
      sections: [{ key: "hook", title: "Hook", narration: "Everyone knows Caesar burned the Library. Almost everyone is wrong." }],
      wordCount: 14, estimatedDurationSec: 6,
    },
  });
  await platform.createArtifact({
    kind: "scene", ownerId: SAMPLE_OWNER, projectId: project.id, runId: run.id,
    key: "set-1", versionNo: 1, isCurrent: true,
    data: {
      sceneNo: 1, sectionKey: "hook",
      narration: "Everyone knows Caesar burned the Library. Almost everyone is wrong.",
      speakerLabel: "Narrator", voWordCount: 11, estimatedVoSec: 4.4, durationEstSec: 5,
      visualDirection: "Ancient harbour at dusk, scrolls silhouetted against smoke on the horizon",
      shotDescription: "Slow push-in over a model harbour", shotType: "wide", cameraMove: "push-in",
      onScreenText: "none", claimIds: [], sourceRefs: [], legalRiskFlag: "none",
      sfx: [], registryRefs: { characterIds: [], locationIds: [], propIds: [] },
      continuityState: { startState: "", endState: "" }, referenceInputs: [],
    },
  });
  await platform.createArtifact({
    kind: "audit_report", ownerId: SAMPLE_OWNER, projectId: project.id, runId: run.id,
    versionNo: 1, isCurrent: true, status: "passed",
    data: { totalScore: 88, threshold: 70, passed: true, areas: {} },
  });
  await platform.createArtifact({
    kind: "certificate", ownerId: SAMPLE_OWNER, projectId: project.id, runId: run.id,
    versionNo: 1, isCurrent: true,
    data: {
      runId: run.id, topic: run.title, verdict: "passed",
      auditedVersions: { scriptVersion: 1, sceneVersion: 1, auditVersion: 1, bibleVersion: 1 },
      issuedAt: new Date().toISOString(),
    },
  });
  await platform.createArtifact({
    kind: "package", ownerId: SAMPLE_OWNER, projectId: project.id, runId: run.id,
    versionNo: 1, isCurrent: true, status: "ready",
    data: { version: 1, files: [], outdated: false },
  });
  return project.id;
}

export async function duplicateSample(deps: AppDeps, userId: string): Promise<string> {
  const platform = deps.platform;
  const sampleId = await ensureSampleProject(deps);
  const sample = await platform.getProject(sampleId!);
  if (!sample) throw new Error("Sample project unavailable");
  const copy = await platform.createProject({
    ownerId: userId,
    type: sample.type,
    name: `${sample.name.replace("SAMPLE — ", "")} (copy)`,
    platform: sample.platform,
    lifecycleStatus: "active",
    isSample: false,
    data: sample.data,
  });
  const artifacts = await platform.listArtifacts({ projectId: sample.id });
  const runIdMap = new Map<string, string>();
  for (const run of await platform.listRuns(sample.id)) {
    const newRun = await platform.createRun({
      projectId: copy.id,
      ownerId: userId,
      title: run.title,
      lifecycleStatus: "active",
      stageMap: run.stageMap,
      stageHistory: run.stageHistory,
      selectedTopicId: run.selectedTopicId,
      snapshots: run.snapshots,
      openIssues: run.openIssues,
      data: run.data,
    });
    runIdMap.set(run.id, newRun.id);
  }
  for (const a of artifacts) {
    await platform.createArtifact({
      kind: a.kind,
      ownerId: userId,
      projectId: copy.id,
      runId: a.runId ? runIdMap.get(a.runId) : undefined,
      key: a.key,
      versionNo: a.versionNo,
      isCurrent: a.isCurrent,
      status: a.status,
      data: a.data,
    });
  }
  return copy.id;
}

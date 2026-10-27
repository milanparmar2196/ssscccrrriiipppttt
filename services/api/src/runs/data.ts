/** Artifact access helpers shared by routes and job handlers. */
import type { ArtifactRecord, PlatformStore, RunRecord } from "../platform/store.js";

type Obj = Record<string, unknown>;

export async function current(
  platform: PlatformStore,
  kind: string,
  scope: { projectId?: string; runId?: string; key?: string },
): Promise<ArtifactRecord | undefined> {
  const rows = await platform.listArtifacts({ kind, ...scope, currentOnly: true });
  return rows.sort((a, b) => b.versionNo - a.versionNo)[0];
}

export async function saveVersioned(
  platform: PlatformStore,
  input: {
    kind: string;
    ownerId: string;
    projectId?: string;
    runId?: string;
    key?: string;
    status?: string;
    data: Obj;
  },
): Promise<ArtifactRecord> {
  const existing = await platform.listArtifacts({
    kind: input.kind,
    projectId: input.projectId,
    runId: input.runId,
    key: input.key,
    currentOnly: true,
  });
  let maxVersion = 0;
  for (const row of existing) {
    maxVersion = Math.max(maxVersion, row.versionNo);
    await platform.updateArtifact(row.id, { isCurrent: false });
  }
  return platform.createArtifact({
    kind: input.kind,
    ownerId: input.ownerId,
    projectId: input.projectId,
    runId: input.runId,
    key: input.key,
    versionNo: maxVersion + 1,
    isCurrent: true,
    status: input.status,
    data: input.data,
  });
}

export async function bibleArtifact(platform: PlatformStore, projectId: string) {
  const versions = await platform.listArtifacts({ kind: "bible_version", projectId });
  const approved = versions
    .filter((v) => v.status === "approved")
    .sort((a, b) => b.versionNo - a.versionNo);
  return approved[0];
}

export async function projectConfigAnswers(
  platform: PlatformStore,
  projectId: string,
): Promise<Record<string, Obj>> {
  const rows = await platform.listArtifacts({
    kind: "config_answers", projectId, key: "project", currentOnly: true,
  });
  return (rows[0]?.data.answers as Record<string, Obj>) ?? {};
}

export function runAnswers(run: RunRecord): Record<string, Obj> {
  return ((run.snapshots.configAnswers as Record<string, Obj>) ?? {});
}

export async function runBible(
  platform: PlatformStore,
  run: RunRecord,
): Promise<Obj | undefined> {
  const version = Number(run.snapshots.bibleVersion ?? 0);
  const versions = await platform.listArtifacts({ kind: "bible_version", projectId: run.projectId });
  const match = versions.find((v) => v.versionNo === version);
  return match?.data;
}

/** Effective research sources for a run: run sources (current brief set). */
export async function researchArtifacts(platform: PlatformStore, runId: string) {
  const brief = await current(platform, "research_brief", { runId });
  const sources = await platform.listArtifacts({ kind: "research_source", runId });
  const claims = await platform.listArtifacts({ kind: "research_claim", runId });
  return { brief, sources, claims };
}

export async function listScenes(platform: PlatformStore, runId: string) {
  const rows = await platform.listArtifacts({ kind: "scene", runId, currentOnly: true });
  return rows.sort((a, b) => Number(a.data.sceneNo ?? 0) - Number(b.data.sceneNo ?? 0));
}

export async function currentScript(platform: PlatformStore, runId: string) {
  return current(platform, "script", { runId });
}

export async function currentOutline(platform: PlatformStore, runId: string) {
  return current(platform, "outline", { runId });
}

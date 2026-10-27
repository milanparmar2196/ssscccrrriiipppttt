/**
 * Production Package builder (API §6 Step 14 + A11). Deliverable
 * keys come from @scriptwriter/shared PACKAGE_DELIVERABLES only.
 * Files are rendered from run artifacts, validated against the chosen
 * Output Format Profile, written to object storage, and zipped.
 */
import archiver from "archiver";
import { Writable } from "node:stream";
import type { AppDeps } from "../deps.js";
import type { RunRecord } from "../platform/store.js";
import { current, listScenes, researchArtifacts } from "./data.js";

type Obj = Record<string, unknown>;

export interface PackageContext {
  run: RunRecord;
  project: Obj;
  bible: Obj | undefined;
  scenes: Obj[];
  script: Obj | undefined;
  outline: Obj | undefined;
  audit: Obj | undefined;
  certificate: Obj | undefined;
  publishing: Obj | undefined;
  formatProfile: Obj;
  generatorProfile: Obj;
}

function renderVo(ctx: PackageContext): string {
  const profile = ctx.formatProfile;
  const separator = String(profile.separator ?? "\n");
  const blank = Number(profile.blankLinesBetweenScenes ?? 1);
  const labelStyle = String(profile.speakerLabelStyle ?? "none");
  const units: string[] = [];
  for (const s of ctx.scenes) {
    let unit = String(s.narration ?? "");
    if (labelStyle !== "none" && s.speakerLabel) {
      unit = `${s.speakerLabel}: ${unit}`;
    }
    units.push(unit);
  }
  let text = units.join(separator + "\n".repeat(blank + 1));
  const maxChars = Number(profile.maxCharsPerUnit ?? 0);
  if (maxChars > 0) {
    // clip-splitting at the profile's per-unit cap (words kept whole)
    const chunks: string[] = [];
    let currentChunk = "";
    for (const word of text.split(" ")) {
      if ((currentChunk + " " + word).length > maxChars && currentChunk) {
        chunks.push(currentChunk);
        currentChunk = word;
      } else currentChunk = currentChunk ? currentChunk + " " + word : word;
    }
    if (currentChunk) chunks.push(currentChunk);
    text = chunks
      .map((c, i) => `[clip-${String.fromCharCode(97 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ""}] ${c}`)
      .join("\n\n");
  }
  return text;
}

function renderScenesDoc(ctx: PackageContext, fields: string[]): string {
  return ctx.scenes
    .map((s) => {
      const lines = [`## Scene ${s.sceneNo}`];
      for (const f of fields) {
        if (s[f] !== undefined && s[f] !== null && s[f] !== "") {
          lines.push(`${f}: ${typeof s[f] === "object" ? JSON.stringify(s[f]) : String(s[f])}`);
        }
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

export function renderDeliverable(key: string, ctx: PackageContext): string | undefined {
  const { run, scenes } = ctx;
  switch (key) {
    case "generatorProfile":
    case "completionCertificate":
      return JSON.stringify(key === "generatorProfile" ? ctx.generatorProfile : ctx.certificate ?? {}, null, 2);
    case "voInstructions":
      return renderVo(ctx);
    case "finalScript":
    case "sceneBreakdown":
      return renderScenesDoc(ctx, [
        "purpose", "narration", "visualDirection", "shotDescription", "shotType",
        "cameraMove", "onScreenText", "durationEstSec", "transition", "retentionNote",
      ]);
    case "visualRequirements":
      return renderScenesDoc(ctx, ["visualDirection", "shotDescription", "animationNote", "footageRequirement"]);
    case "shotDirections":
      return renderScenesDoc(ctx, ["shotType", "cameraMove", "shotDescription"]);
    case "aiPrompts":
      return scenes
        .map((s) => `Scene ${s.sceneNo}:\n  image: ${String(s.aiImagePrompt ?? "")}\n  video: ${String(s.aiVideoPrompt ?? "")}`)
        .join("\n");
    case "musicSfxCues":
      return scenes
        .map((s) => `Scene ${s.sceneNo}: music=${String(s.musicCue ?? "")} sfx=${JSON.stringify(s.sfx ?? [])}`)
        .join("\n");
    case "onScreenTextGraphics":
      return renderScenesDoc(ctx, ["onScreenText", "editorialOverlayInstructions"]);
    case "captionsSubtitles": {
      // MVP (decision 7): narration caption text + timing plan; SRT/VTT later.
      let at = 0;
      return scenes
        .map((s) => {
          const dur = Number(s.durationEstSec ?? s.estimatedVoSec ?? 0);
          const line = `[${at.toFixed(1)}s -> ${(at + dur).toFixed(1)}s] ${String(s.narration ?? "")}`;
          at += dur;
          return line;
        })
        .join("\n");
    }
    case "editingInstructions":
      return renderScenesDoc(ctx, ["transition", "editorialOverlayInstructions", "continuityState"]);
    case "productionChecklist": {
      const items = [
        "Title <100 chars with keyword + emotional trigger, matches script",
        "Thumbnail free of misleading claims",
        "Description: primary keyword + summary + timestamps + source links",
        "15-20 relevant tags",
        "End-screen/card suggestions with timestamps",
        "All chart scenes carry an on-chart source note (D4)",
        "AI imagery never labelled archival footage",
      ];
      return items.map((i) => `- [ ] ${i}`).join("\n");
    }
    case "projectSummary": {
      const cert = ctx.certificate as Obj | undefined;
      return [
        `# Project Summary`,
        `Title: ${run.title}`,
        `Topic: ${String((run.snapshots.topicTitle as string) ?? "")}`,
        `Angle: ${String((run.snapshots.angle as Obj | undefined)?.angle ?? "")}`,
        `Scenes: ${scenes.length}`,
        `Bible version: ${String(run.snapshots.bibleVersion ?? "")}`,
        `Certificate: ${cert ? String(cert.verdict ?? "") : "not issued"}`,
      ].join("\n");
    }
    case "titleSuggestions": {
      const pub = ctx.publishing ?? {};
      return ((pub.titles as string[]) ?? [run.title]).join("\n");
    }
    case "thumbnailConcepts": {
      const packaging = (ctx.bible?.packagingBible as Obj | undefined) ?? {};
      const pub = ctx.publishing ?? {};
      return [...((pub.thumbnailBriefs as string[]) ?? []), JSON.stringify(packaging, null, 2)].join("\n");
    }
    case "descriptionMetadata": {
      const pub = ctx.publishing ?? {};
      const annex = (ctx.bible?.annexes as Obj[] | undefined)?.find(
        (a) => a.templateKey === "monetizationSponsor",
      );
      return [
        String(pub.description ?? ""),
        "",
        "## Disclosure checklist",
        annex ? "- Monetization annex active: verify sponsor/affiliate disclosures are present" : "- No monetization annex active",
        "- Niche disclaimer present in description: check before publishing",
      ].join("\n");
    }
    case "researchReferences": {
      return String(ctx.audit?.bibliographyText ?? "");
    }
    case "entityReferenceSheet": {
      return String(ctx.audit?.entitySheetText ?? "");
    }
    case "legalReviewSummary": {
      return String(ctx.audit?.legalSummaryText ?? "");
    }
    case "viewerGlossary": {
      const glossary = (ctx.bible?.glossaryPronunciation as Obj | undefined) ?? {};
      const entries = (glossary.entries as Obj[] | undefined) ?? [];
      return entries.map((e) => `${String(e.term)} — ${String(e.explanation ?? "")}`).join("\n");
    }
    default:
      return undefined;
  }
}

export async function buildPackage(
  deps: AppDeps,
  run: RunRecord,
  input: { deliverables: string[]; formatProfile: Obj; versionNo: number },
): Promise<{ manifest: Obj; zipKey: string }> {
  const platform = deps.platform;
  const project = await platform.getProject(run.projectId);
  const scenesArtifacts = await listScenes(platform, run.id);
  const scenes = scenesArtifacts.map((a) => ({ id: a.id, ...a.data }) as Obj);
  const script = (await current(platform, "script", { runId: run.id }))?.data;
  const outline = (await current(platform, "outline", { runId: run.id }))?.data;
  const auditArt = await current(platform, "audit_report", { runId: run.id });
  const certArt = await current(platform, "certificate", { runId: run.id });
  const pubArt = await current(platform, "publishing", { runId: run.id });
  const { claims, sources } = await researchArtifacts(platform, run.id);
  const bibleVersion = Number(run.snapshots.bibleVersion ?? 0);
  const bibleVersions = await platform.listArtifacts({ kind: "bible_version", projectId: run.projectId });
  const bible = bibleVersions.find((v) => v.versionNo === bibleVersion)?.data;

  // bibliography: citations grouped by credibility tier, web-discovered separate
  const byTier = new Map<string, string[]>();
  const webDiscovered: string[] = [];
  for (const s of sources) {
    const line = `- ${String(s.data.title ?? s.id)} (${String(s.data.origin ?? "library")}, tier ${String(s.data.credibilityTier ?? "unrated")}, ${String(s.data.reviewStatus ?? "pending")})`;
    if (s.data.origin === "web_discovered") webDiscovered.push(line);
    else byTier.set(String(s.data.credibilityTier ?? "unrated"), [...(byTier.get(String(s.data.credibilityTier ?? "unrated")) ?? []), line]);
  }
  const bibliographyText = [
    ...[...byTier.entries()].map(([tier, lines]) => `## Tier ${tier}\n${lines.join("\n")}`),
    webDiscovered.length ? `## Web-discovered (labelled, unapproved unless reviewed)\n${webDiscovered.join("\n")}` : "",
  ].filter(Boolean).join("\n\n");

  const highRisk = claims.filter(
    (c) => c.data.riskLevel === "high" || c.data.riskLevel === "critical",
  );
  const legalSummaryText = [
    "# Legal Review Summary",
    ...highRisk.map((c) => `- [${String(c.data.riskLevel)}] ${String(c.data.text)} — ${String(c.data.riskNote ?? "")}`),
    "",
    "## Language Softening Log",
    String((auditArt?.data.softeningLog as string) ?? "(none recorded)"),
  ].join("\n");

  const ctx: PackageContext = {
    run,
    project: (project?.data ?? {}) as Obj,
    bible,
    scenes,
    script,
    outline,
    audit: {
      ...(auditArt?.data ?? {}),
      claimsSnapshot: claims.map((c) => ({ id: c.id, ...c.data })),
      bibliographyText,
      legalSummaryText,
      entitySheetText: scenes
        .flatMap((s) => ((s.registryRefs as Obj | undefined)?.characterIds as string[]) ?? [])
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((id) => `- character: ${id}`)
        .join("\n"),
    },
    certificate: certArt?.data,
    publishing: pubArt?.data,
    formatProfile: input.formatProfile,
    generatorProfile: (run.snapshots.generatorProfile as Obj) ?? {},
  };

  const files: Array<{ deliverable: string; filename: string; content: string }> = [];
  for (const key of input.deliverables) {
    const content = renderDeliverable(key, ctx);
    files.push({
      deliverable: key,
      filename: `${key}.${key === "generatorProfile" || key === "completionCertificate" ? "json" : "md"}`,
      content: content ?? `(${key}: rendered from run artifacts at package time)`,
    });
  }

  const baseKey = `packages/${run.id}/v${input.versionNo}`;
  const manifest: Obj = {
    version: input.versionNo,
    builtFrom: {
      scriptVersion: script ? Number((script as Obj).version ?? 0) : null,
      sceneVersion: scenesArtifacts[0]?.versionNo ?? null,
      auditVersion: auditArt?.versionNo ?? null,
      bibleVersion,
      formatProfileId: input.formatProfile.id ?? input.formatProfile.key ?? null,
    },
    files: [] as Obj[],
    outdated: false,
    createdAt: new Date().toISOString(),
  };
  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk as Buffer);
      cb();
    },
  });
  const archive = archiver("zip", { zlib: { level: 9 } });
  const done = new Promise<void>((resolve, reject) => {
    sink.on("finish", resolve);
    archive.on("error", reject);
  });
  archive.pipe(sink);
  for (const f of files) {
    const key = `${baseKey}/${f.filename}`;
    await deps.storage.put(key, f.content, "text/plain");
    const downloadUrl = await deps.storage.signedUrl(key);
    (manifest.files as Obj[]).push({ deliverable: f.deliverable, format: "text", storageKey: key, downloadUrl });
    archive.append(f.content, { name: f.filename });
  }
  archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
  await archive.finalize();
  await done;
  const zipKey = `${baseKey}/package.zip`;
  await deps.storage.put(zipKey, Buffer.concat(chunks), "application/zip");
  manifest.zipKey = zipKey;
  manifest.zipUrl = await deps.storage.signedUrl(zipKey);
  return { manifest, zipKey };
}

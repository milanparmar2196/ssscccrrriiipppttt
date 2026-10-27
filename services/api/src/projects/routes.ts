import type { FastifyInstance } from "fastify";
import { BIBLE_MASTER_LIST_KEYS, BIBLE_SECTION_KEYS } from "@scriptwriter/shared";
import { ApiError, successBody } from "../errors.js";
import type { AppDeps } from "../deps.js";
import {
  assertProjectMutable,
  ownedProject,
  publicProject,
  startJob,
  user,
  type JobBody,
} from "../routes/helpers.js";
import { bibleArtifact, current, saveVersioned } from "../runs/data.js";
import { ensureSampleProject } from "./sample.js";
import { getRegistrySeed } from "../ai/library.js";

type Obj = Record<string, unknown>;

export function registerProjectRoutes(app: FastifyInstance, deps: AppDeps): void {
  const platform = deps.platform;

  /* ---------- projects CRUD ---------- */
  app.post<{ Body: Obj }>("/projects", async (req) => {
    const me = await user(req, deps);
    const body = req.body ?? {};
    if (typeof body.name !== "string" || !body.name) {
      throw new ApiError("VALIDATION", "Project name is required");
    }
    const project = await platform.createProject({
      ownerId: me.id,
      type: body.type === "brand" ? "brand" : "personal",
      name: body.name,
      platform: typeof body.platform === "string" ? body.platform : "youtube_long",
      lifecycleStatus: "active",
      isSample: false,
      brandId: typeof body.brandId === "string" ? body.brandId : undefined,
      data: { settings: (body.settings as Obj) ?? {} },
    });
    return successBody(publicProject(project));
  });

  app.get("/projects", async (req) => {
    const me = await user(req, deps);
    await ensureSampleProject(deps);
    const includeArchived = (req.query as Obj)?.archived === "1";
    const rows = await platform.listProjects(me.id, {
      includeArchived: Boolean(includeArchived),
      includeSample: true,
    });
    return successBody(rows.map(publicProject));
  });

  app.get<{ Params: { id: string } }>("/projects/:id", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    return successBody(publicProject(project));
  });

  app.patch<{ Params: { id: string }; Body: Obj }>("/projects/:id", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    const patch: Partial<typeof project> = {};
    if (typeof req.body?.name === "string") patch.name = req.body.name;
    if (typeof req.body?.platform === "string") patch.platform = req.body.platform;
    if (req.body?.settings && typeof req.body.settings === "object") {
      patch.data = {
        ...project.data,
        settings: { ...(project.data.settings as Obj), ...(req.body.settings as Obj) },
      };
    }
    return successBody(publicProject(await platform.updateProject(project.id, patch)));
  });

  /* ---------- lifecycle (D3) ---------- */
  app.post<{ Params: { id: string } }>("/projects/:id/archive", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    await cancelJobsFor(deps, { projectId: project.id });
    return successBody(publicProject(
      await platform.updateProject(project.id, { lifecycleStatus: "archived" }),
    ));
  });

  app.delete<{ Params: { id: string }; Body: Obj }>("/projects/:id", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    if (project.isSample) throw new ApiError("SAMPLE_READ_ONLY", "The sample project cannot be deleted");
    const confirm = (req.body ?? {}).confirmName;
    if (confirm !== project.name) {
      throw new ApiError("VALIDATION", "Deletion requires confirmName matching the project name", {
        required: project.name,
      });
    }
    await cancelJobsFor(deps, { projectId: project.id });
    const updated = await platform.updateProject(project.id, {
      lifecycleStatus: "pending_deletion",
      deletionRequestedAt: new Date().toISOString(),
    });
    return successBody({ ...publicProject(updated), purgeAfterDays: 30 });
  });

  app.post<{ Params: { id: string } }>("/projects/:id/restore", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const updated = await platform.updateProject(project.id, {
      lifecycleStatus: "active",
      deletionRequestedAt: null,
    });
    return successBody(publicProject(updated));
  });

  app.get<{ Params: { id: string } }>("/projects/:id/summary", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const bible = await bibleArtifact(platform, project.id);
    const runs = await platform.listRuns(project.id);
    const ledger = await deps.auth.store.listLedger(me.id, 1000, 0);
    const creditsUsed = ledger
      .filter((e) => e.kind === "charge")
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    return successBody({
      projectId: project.id,
      bibleVersion: bible?.versionNo ?? null,
      runsCount: runs.length,
      topicsCount: (await platform.listArtifacts({ kind: "topic", projectId: project.id })).length,
      creditsUsed,
    });
  });

  /* ---------- niches & strategy (Steps 1-3) ---------- */
  app.put<{ Params: { id: string }; Body: Obj }>("/projects/:id/niches", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    const niches = (req.body?.niches as Obj[]) ?? [];
    for (const old of await platform.listArtifacts({ kind: "project_niche", projectId: project.id, currentOnly: true })) {
      await platform.updateArtifact(old.id, { isCurrent: false });
    }
    const saved = [];
    for (const niche of niches) {
      saved.push(await platform.createArtifact({
        kind: "project_niche", ownerId: me.id, projectId: project.id,
        key: String(niche.id ?? niche.name), versionNo: 1, isCurrent: true, data: niche,
      }));
    }
    return successBody(saved.map((s) => ({ id: s.id, ...s.data })));
  });

  app.get<{ Params: { id: string } }>("/projects/:id/niches", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const rows = await platform.listArtifacts({ kind: "project_niche", projectId: project.id, currentOnly: true });
    return successBody(rows.map((s) => ({ id: s.id, ...s.data })));
  });

  app.post<{ Params: { id: string; nicheId: string }; Body: Obj }>(
    "/projects/:id/niches/:nicheId/sub-niches",
    async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      assertProjectMutable(project);
      const saved = await platform.createArtifact({
        kind: "project_sub_niche", ownerId: me.id, projectId: project.id,
        key: req.params.nicheId, versionNo: 1, isCurrent: true, data: req.body ?? {},
      });
      return successBody({ id: saved.id, ...saved.data });
    },
  );

  app.get<{ Params: { id: string } }>("/projects/:id/audience-strategy", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const row = await current(platform, "audience_strategy", { projectId: project.id });
    return successBody(row?.data ?? null);
  });

  app.put<{ Params: { id: string }; Body: Obj }>("/projects/:id/audience-strategy", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    const saved = await saveVersioned(platform, {
      kind: "audience_strategy", ownerId: me.id, projectId: project.id, data: req.body ?? {},
    });
    return successBody(saved.data);
  });

  /* ---------- configuration answers (§6A) ---------- */
  app.get<{ Params: { id: string } }>("/projects/:id/configuration", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const row = await current(platform, "config_answers", { projectId: project.id, key: "project" });
    return successBody(row?.data ?? { answers: {} });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/projects/:id/config-answers", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    const existing = await current(platform, "config_answers", { projectId: project.id, key: "project" });
    const answers = {
      ...((existing?.data.answers as Obj) ?? {}),
      ...((req.body?.answers as Obj) ?? {}),
    };
    const saved = await saveVersioned(platform, {
      kind: "config_answers", ownerId: me.id, projectId: project.id, key: "project",
      data: { answers },
    });
    return successBody(saved.data);
  });

  /* ---------- Bible (Step 8) ---------- */
  app.post<{ Params: { id: string }; Body: JobBody }>("/projects/:id/bible/generate", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    const job = await startJob(req, deps, me, {
      action: "bible_generate",
      params: { units: 1 },
      projectId: project.id,
      body: req.body ?? {},
    });
    return successBody({ jobId: job.id, status: job.status });
  });

  app.get<{ Params: { id: string } }>("/projects/:id/bible", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const rows = await platform.listArtifacts({ kind: "bible_version", projectId: project.id });
    const currentRow =
      rows.filter((r) => r.status === "approved").sort((a, b) => b.versionNo - a.versionNo)[0] ??
      rows.sort((a, b) => b.versionNo - a.versionNo)[0];
    if (!currentRow) return successBody(null);
    return successBody({ version: currentRow.versionNo, status: currentRow.status, ...currentRow.data });
  });

  app.get<{ Params: { id: string } }>("/projects/:id/bible/versions", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const rows = await platform.listArtifacts({ kind: "bible_version", projectId: project.id });
    return successBody(rows.map((r) => ({ version: r.versionNo, status: r.status, updatedAt: r.updatedAt })));
  });

  app.get<{ Params: { id: string; v: string } }>("/projects/:id/bible/versions/:v", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const rows = await platform.listArtifacts({ kind: "bible_version", projectId: project.id });
    const row = rows.find((r) => r.versionNo === Number(req.params.v));
    if (!row) throw new ApiError("NOT_FOUND", "Bible version not found");
    return successBody({ version: row.versionNo, status: row.status, ...row.data });
  });

  app.patch<{ Params: { id: string; v: string }; Body: Obj }>(
    "/projects/:id/bible/versions/:v",
    async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      assertProjectMutable(project);
      const rows = await platform.listArtifacts({ kind: "bible_version", projectId: project.id });
      const row = rows.find((r) => r.versionNo === Number(req.params.v));
      if (!row) throw new ApiError("NOT_FOUND", "Bible version not found");
      if (row.status === "approved") {
        throw new ApiError("CONFLICT", "Approved Bible versions are immutable — edit a draft");
      }
      const data = { ...row.data };
      for (const key of BIBLE_SECTION_KEYS) {
        if ((req.body as Obj)[key] !== undefined) data[key] = (req.body as Obj)[key];
      }
      if ((req.body as Obj).annexes !== undefined) data.annexes = (req.body as Obj).annexes;
      const updated = await platform.updateArtifact(row.id, { data });
      return successBody({ version: updated.versionNo, status: updated.status, ...updated.data });
    },
  );

  app.post<{ Params: { id: string; v: string } }>("/projects/:id/bible/versions/:v/approve", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    const rows = await platform.listArtifacts({ kind: "bible_version", projectId: project.id });
    const row = rows.find((r) => r.versionNo === Number(req.params.v));
    if (!row) throw new ApiError("NOT_FOUND", "Bible version not found");
    const updated = await platform.updateArtifact(row.id, { status: "approved" });
    return successBody({ version: updated.versionNo, status: "approved" });
  });

  app.get<{ Params: { id: string } }>("/projects/:id/bible/annexes", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const rows = await platform.listArtifacts({ kind: "bible_version", projectId: project.id });
    const draft = rows.filter((r) => r.status !== "approved").sort((a, b) => b.versionNo - a.versionNo)[0]
      ?? rows.sort((a, b) => b.versionNo - a.versionNo)[0];
    return successBody(((draft?.data.annexes as Obj[]) ?? []));
  });

  app.put<{ Params: { id: string }; Body: Obj }>("/projects/:id/bible/annexes", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    const rows = await platform.listArtifacts({ kind: "bible_version", projectId: project.id });
    const draft = rows.filter((r) => r.status !== "approved").sort((a, b) => b.versionNo - a.versionNo)[0];
    if (!draft) throw new ApiError("NOT_FOUND", "No draft Bible version to hold annexes");
    const updated = await platform.updateArtifact(draft.id, {
      data: { ...draft.data, annexes: (req.body?.annexes as Obj[]) ?? [] },
    });
    return successBody((updated.data.annexes as Obj[]) ?? []);
  });

  /* ---------- proposed Bible edits (Step 15 flow) ---------- */
  app.get<{ Params: { id: string } }>("/projects/:id/bible/proposed-edits", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const rows = await platform.listArtifacts({ kind: "proposed_bible_edit", projectId: project.id });
    return successBody(rows.map((r) => ({ id: r.id, status: r.status, ...r.data })));
  });

  app.post<{ Params: { id: string; editId: string }; Body: Obj }>(
    "/projects/:id/bible/proposed-edits/:editId/approve",
    async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      assertProjectMutable(project);
      const edit = await platform.getArtifact(req.params.editId);
      if (!edit || edit.kind !== "proposed_bible_edit" || edit.projectId !== project.id) {
        throw new ApiError("NOT_FOUND", "Proposed edit not found");
      }
      if (edit.status !== "pending") throw new ApiError("CONFLICT", "Edit already decided");
      const bible = await bibleArtifact(platform, project.id);
      const baseData = (bible?.data ?? {}) as Obj;
      const sectionKey = String(edit.data.sectionKey);
      const newVersion = await saveVersioned(platform, {
        kind: "bible_version", ownerId: me.id, projectId: project.id, status: "draft",
        data: {
          ...baseData,
          [sectionKey]: {
            ...((baseData[sectionKey] as Obj) ?? {}),
            text: String(edit.data.changeSummary),
            fromProposedEdit: edit.id,
          },
          performanceLearningsLog: {
            ...((baseData.performanceLearningsLog as Obj) ?? {}),
            entries: [
              ...(((baseData.performanceLearningsLog as Obj)?.entries as Obj[]) ?? []),
              { editId: edit.id, summary: edit.data.changeSummary, at: new Date().toISOString() },
            ],
          },
        },
      });
      await platform.updateArtifact(edit.id, {
        status: "approved",
        data: { ...edit.data, decidedAt: new Date().toISOString(), decidedBy: me.id, newBibleVersion: newVersion.versionNo },
      });
      return successBody({ applied: true, newBibleVersion: newVersion.versionNo, note: "New version is a draft — approve it via the normal Bible flow to make it current" });
    },
  );

  app.post<{ Params: { id: string; editId: string }; Body: Obj }>(
    "/projects/:id/bible/proposed-edits/:editId/reject",
    async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      const edit = await platform.getArtifact(req.params.editId);
      if (!edit || edit.kind !== "proposed_bible_edit" || edit.projectId !== project.id) {
        throw new ApiError("NOT_FOUND", "Proposed edit not found");
      }
      if (edit.status !== "pending") throw new ApiError("CONFLICT", "Edit already decided");
      await platform.updateArtifact(edit.id, {
        status: "rejected",
        data: { ...edit.data, decidedAt: new Date().toISOString(), decidedBy: me.id, note: req.body?.note },
      });
      return successBody({ rejected: true });
    },
  );

  /* ---------- master lists (7) ---------- */
  for (const listKey of BIBLE_MASTER_LIST_KEYS) {
    app.get<{ Params: { id: string } }>(`/projects/:id/master-lists/${listKey}`, async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      const rows = await platform.listArtifacts({
        kind: "master_list_entry", projectId: project.id, key: listKey, currentOnly: true,
      });
      return successBody(rows.map((r) => ({ id: r.id, ...r.data })));
    });
    app.post<{ Params: { id: string }; Body: Obj }>(`/projects/:id/master-lists/${listKey}`, async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      assertProjectMutable(project);
      const saved = await platform.createArtifact({
        kind: "master_list_entry", ownerId: me.id, projectId: project.id, key: listKey,
        versionNo: 1, isCurrent: true, data: { ...(req.body ?? {}), history: [{ action: "created", at: new Date().toISOString(), by: me.id }] },
      });
      return successBody({ id: saved.id, ...saved.data });
    });
    app.patch<{ Params: { id: string; entryId: string }; Body: Obj }>(
      `/projects/:id/master-lists/${listKey}/:entryId`,
      async (req) => {
        const me = await user(req, deps);
        const project = await ownedProject(deps, me.id, req.params.id);
        assertProjectMutable(project);
        const entry = await platform.getArtifact(req.params.entryId);
        if (!entry || entry.projectId !== project.id || entry.key !== listKey) {
          throw new ApiError("NOT_FOUND", "Entry not found");
        }
        const history = [ ...((entry.data.history as Obj[]) ?? []), { action: "edited", at: new Date().toISOString(), by: me.id } ];
        const updated = await platform.updateArtifact(entry.id, { data: { ...entry.data, ...(req.body ?? {}), history } });
        return successBody({ id: updated.id, ...updated.data });
      },
    );
    app.delete<{ Params: { id: string; entryId: string } }>(
      `/projects/:id/master-lists/${listKey}/:entryId`,
      async (req) => {
        const me = await user(req, deps);
        const project = await ownedProject(deps, me.id, req.params.id);
        assertProjectMutable(project);
        const entry = await platform.getArtifact(req.params.entryId);
        if (!entry || entry.projectId !== project.id || entry.key !== listKey) {
          throw new ApiError("NOT_FOUND", "Entry not found");
        }
        await platform.updateArtifact(entry.id, { isCurrent: false, status: "removed" });
        return successBody({ removed: true });
      },
    );
  }

  /* ---------- registries (11 types) ---------- */
  app.get<{ Params: { id: string } }>("/projects/:id/registries", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const seed = await getRegistrySeed(platform);
    // Resolution (A8): category map by the project's first niche category.
    const nicheRows = await platform.listArtifacts({ kind: "project_niche", projectId: project.id, currentOnly: true });
    const categoryKey = String(nicheRows[0]?.data.categoryKey ?? "");
    const assignment = seed.assignments.find((a) => a.categoryKey === categoryKey);
    const override = seed.overrides.find(
      (o) => String(o.nicheId) === String(nicheRows[0]?.data.id ?? ""),
    );
    const primary = (override?.primary as string) ?? (assignment?.primary as string) ?? "concept";
    const secondary = (override?.secondary as string[]) ?? (assignment?.secondary as string[]) ?? [];
    const entries = await platform.listArtifacts({
      kind: "registry_entry", projectId: project.id, currentOnly: true,
    });
    return successBody({
      resolvedSet: { primary, secondary, universal: seed.universalSet },
      entries: entries.map((e) => ({ id: e.id, registryType: e.key, ...e.data })),
    });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/projects/:id/registries", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    assertProjectMutable(project);
    const type = String(req.body?.registryType ?? "");
    const seed = await getRegistrySeed(platform);
    if (!seed.types.some((t) => t.key === type)) {
      throw new ApiError("VALIDATION", `Unknown registry type: ${type}`);
    }
    const saved = await platform.createArtifact({
      kind: "registry_entry", ownerId: me.id, projectId: project.id, key: type,
      versionNo: 1, isCurrent: true, data: (req.body?.entry as Obj) ?? {},
    });
    return successBody({ id: saved.id, registryType: type, ...saved.data });
  });

  app.patch<{ Params: { id: string; entryId: string }; Body: Obj }>(
    "/projects/:id/registries/:entryId",
    async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      assertProjectMutable(project);
      const entry = await platform.getArtifact(req.params.entryId);
      if (!entry || entry.projectId !== project.id || entry.kind !== "registry_entry") {
        throw new ApiError("NOT_FOUND", "Registry entry not found");
      }
      const updated = await platform.updateArtifact(entry.id, { data: { ...entry.data, ...(req.body ?? {}) } });
      return successBody({ id: updated.id, registryType: updated.key, ...updated.data });
    },
  );

  app.delete<{ Params: { id: string; entryId: string } }>(
    "/projects/:id/registries/:entryId",
    async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      assertProjectMutable(project);
      const entry = await platform.getArtifact(req.params.entryId);
      if (!entry || entry.projectId !== project.id || entry.kind !== "registry_entry") {
        throw new ApiError("NOT_FOUND", "Registry entry not found");
      }
      await platform.updateArtifact(entry.id, { isCurrent: false, status: "archived" });
      return successBody({ archived: true });
    },
  );

  /* ---------- exports (A10) ---------- */
  app.post<{ Params: { id: string }; Body: JobBody }>("/projects/:id/export", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    if (project.ownerId !== me.id) throw new ApiError("FORBIDDEN", "Exports are owner-only");
    const record = await platform.createArtifact({
      kind: "project_export", ownerId: me.id, projectId: project.id,
      versionNo: 1, isCurrent: true, status: "pending", data: { createdAt: new Date().toISOString() },
    });
    const job = await startJob(req, deps, me, {
      action: "export_generate",
      params: { units: 1, projectId: project.id, exportId: record.id },
      projectId: project.id,
      body: req.body ?? {},
    });
    return successBody({ exportId: record.id, jobId: job.id, status: "pending" });
  });

  app.get<{ Params: { id: string; exportId: string } }>(
    "/projects/:id/exports/:exportId",
    async (req) => {
      const me = await user(req, deps);
      const project = await ownedProject(deps, me.id, req.params.id);
      if (project.ownerId !== me.id) throw new ApiError("FORBIDDEN", "Exports are owner-only");
      const record = await platform.getArtifact(req.params.exportId);
      if (!record || record.projectId !== project.id) throw new ApiError("NOT_FOUND", "Export not found");
      return successBody({ id: record.id, status: record.status, ...record.data });
    },
  );
}

async function cancelJobsFor(
  deps: AppDeps,
  scope: { projectId?: string; runId?: string },
): Promise<void> {
  const { cancelJob } = await import("../jobs/engine.js");
  const queued = [
    ...(scope.projectId
      ? await deps.platform.listJobs({ projectId: scope.projectId, status: "queued" })
      : []),
    ...(scope.runId ? await deps.platform.listJobs({ runId: scope.runId, status: "queued" }) : []),
  ];
  const running = [
    ...(scope.projectId
      ? await deps.platform.listJobs({ projectId: scope.projectId, status: "running" })
      : []),
    ...(scope.runId ? await deps.platform.listJobs({ runId: scope.runId, status: "running" }) : []),
  ];
  for (const job of [...queued, ...running]) {
    await cancelJob(deps, job).catch(() => undefined);
  }
}

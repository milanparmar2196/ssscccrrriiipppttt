import type { FastifyInstance } from "fastify";
import { successBody, ApiError } from "../errors.js";
import type { AppDeps } from "../deps.js";
import { ownedProject, user } from "../routes/helpers.js";
import {
  getAnglesForTarget,
  getConfigQuestions,
  getTaxonomy,
} from "../ai/library.js";

type Obj = Record<string, unknown>;

export function registerTaxonomyRoutes(app: FastifyInstance, deps: AppDeps): void {
  const platform = deps.platform;

  app.get("/taxonomy/categories", async () => {
    const { categories } = await getTaxonomy(platform);
    return successBody(categories);
  });

  app.get("/taxonomy/niches", async (req) => {
    const { niches } = await getTaxonomy(platform);
    const q = req.query as Obj;
    const filtered = q.categoryKey
      ? niches.filter((n) => n.categoryKey === q.categoryKey)
      : niches;
    return successBody(filtered);
  });

  app.get<{ Params: { id: string } }>("/taxonomy/niches/:id/sub-niches", async (req) => {
    const { subs } = await getTaxonomy(platform);
    return successBody(subs.filter((s) => String(s.parentId) === req.params.id));
  });

  app.get<{ Params: { kind: string } }>("/presets/:kind", async (req) => {
    const records = await platform.listLibraryRecords(`preset_${req.params.kind}`);
    return successBody(records.filter((r) => r.status === "active").map((r) => r.payload));
  });

  /** Dynamic form schema (§6A): global + niche packs + step scoped. */
  app.get("/config-schema", async (req) => {
    const q = req.query as Obj;
    const questions = await getConfigQuestions(platform);
    const { niches } = await getTaxonomy(platform);
    let categoryKey: string | undefined;
    if (q.nicheId) {
      const niche = niches.find((n) => String(n.id) === String(q.nicheId));
      categoryKey = niche?.categoryKey as string | undefined;
    }
    const applicable = questions.filter((question) => {
      const scope = String(question.scope ?? "global");
      if (q.stepKey && question.stepKey && question.stepKey !== q.stepKey) return false;
      if (scope === "global" || scope === "project" || scope === "run") return true;
      if (scope === "niche" || scope === "category") {
        const keys = (question.appliesToCategoryKeys as string[] | undefined) ?? [];
        return categoryKey ? keys.includes(categoryKey) : false;
      }
      return true;
    });
    return successBody(
      applicable.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)),
    );
  });

  app.get<{ Params: { nicheId: string } }>("/niches/:nicheId/questions", async (req) => {
    const questions = await getConfigQuestions(platform);
    const { niches } = await getTaxonomy(platform);
    const niche = niches.find((n) => String(n.id) === req.params.nicheId);
    const assignments = await platform.listLibraryRecords("niche_question");
    const resolved: Obj[] = questions
      .filter((q) => q.scope === "global" || q.scope === "project" || q.scope === "run")
      .map((q) => ({ ...q, mode: "assigned" }));
    for (const a of assignments) {
      if (a.recordKey.startsWith(`${req.params.nicheId}:`) && a.status === "active") {
        resolved.push({ ...(a.payload as Obj), mode: (a.payload as Obj).mode ?? "assigned" });
      }
    }
    const packs = questions.filter(
      (q) =>
        q.scope === "niche" &&
        ((q.appliesToCategoryKeys as string[] | undefined) ?? []).includes(
          String(niche?.categoryKey ?? ""),
        ),
    );
    return successBody([...resolved, ...packs.map((p) => ({ ...p, mode: "assigned" }))]);
  });

  app.get<{ Params: { nicheId: string } }>("/niches/:nicheId/angles", async (req) => {
    const angles = await getAnglesForTarget(platform, req.params.nicheId);
    return successBody(
      angles
        .filter((a) => a.status !== "archived")
        .map((a) => ({
          ...a,
          titleOnlyLabel: a.completeness === "title_only" ? "Title only" : undefined,
        })),
    );
  });

  /* ---------- niche templates (user side) ---------- */
  app.get("/niche-templates", async (req) => {
    const me = await user(req, deps);
    const q = req.query as Obj;
    const records = await platform.listLibraryRecords("niche_template");
    const mine = records.filter(
      (r) =>
        r.status === "active" &&
        ((r.payload.scope as string) === "global" || r.payload.ownerId === me.id) &&
        (!q.nicheId || String(r.payload.nicheId) === String(q.nicheId)) &&
        (!q.scope || (r.payload.scope as string) === q.scope),
    );
    return successBody(mine.map((r) => ({ id: r.recordKey, version: r.version, ...r.payload })));
  });

  app.get<{ Params: { id: string } }>("/niche-templates/:id", async (req) => {
    const record = await platform.getLibraryRecord("niche_template", req.params.id);
    if (!record) throw new ApiError("NOT_FOUND", "Template not found");
    return successBody({ id: record.recordKey, version: record.version, ...record.payload });
  });

  app.post<{ Body: Obj }>("/niche-templates", async (req) => {
    const me = await user(req, deps);
    const body = req.body ?? {};
    const key = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const saved = await platform.putLibraryRecord({
      kind: "niche_template",
      recordKey: key,
      payload: { ...body, scope: "personal", ownerId: me.id },
      version: 1,
      status: "active",
      updatedBy: me.id,
    });
    return successBody({ id: saved.recordKey, version: 1, ...saved.payload });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/niche-templates/:id/clone", async (req) => {
    const me = await user(req, deps);
    const source = await platform.getLibraryRecord("niche_template", req.params.id);
    if (!source) throw new ApiError("NOT_FOUND", "Template not found");
    const key = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const saved = await platform.putLibraryRecord({
      kind: "niche_template",
      recordKey: key,
      payload: {
        ...source.payload,
        nicheId: req.body?.targetNicheId ?? source.payload.nicheId,
        scope: req.body?.scope ?? "personal",
        ownerId: me.id,
        clonedFrom: source.recordKey,
      },
      version: 1,
      status: "active",
      updatedBy: me.id,
    });
    return successBody({ id: saved.recordKey, version: 1, ...saved.payload });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/projects/:id/apply-template", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const template = await platform.getLibraryRecord("niche_template", String(req.body?.templateId));
    if (!template) throw new ApiError("NOT_FOUND", "Template not found");
    const sections = (template.payload.sections as Obj) ?? {};
    const wanted = (req.body?.sections as string[] | undefined) ?? Object.keys(sections);
    const results: Record<string, string> = {};
    for (const section of wanted) {
      const content = sections[section];
      if (content === undefined) {
        results[section] = "skipped";
        continue;
      }
      const existing = await platform.listArtifacts({
        kind: `template_section_${section}`, projectId: project.id, currentOnly: true,
      });
      if (existing.length > 0 && existing[0]!.data.userEdited) {
        results[section] = "conflict"; // never silently overwritten
        continue;
      }
      await platform.createArtifact({
        kind: `template_section_${section}`, ownerId: me.id, projectId: project.id,
        versionNo: 1, isCurrent: true, data: content as Obj,
      });
      results[section] = "applied";
    }
    await platform.updateProject(project.id, {
      data: {
        ...project.data,
        appliedTemplateId: template.recordKey,
        appliedTemplateVersion: template.version,
      },
    });
    return successBody({ results, appliedTemplateId: template.recordKey, templateVersion: template.version });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/projects/:id/save-as-template", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const scope = req.body?.scope === "global" ? "global" : "personal";
    if (scope === "global" && !req.auth?.actor) {
      // global scope requires admin — enforced again in the admin routes;
      // user-side saves are personal only.
    }
    const strategy = await platform.listArtifacts({ kind: "audience_strategy", projectId: project.id, currentOnly: true });
    const answers = await platform.listArtifacts({ kind: "config_answers", projectId: project.id, currentOnly: true });
    const key = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const saved = await platform.putLibraryRecord({
      kind: "niche_template",
      recordKey: key,
      payload: {
        name: req.body?.name ?? `${project.name} template`,
        nicheId: req.body?.nicheId,
        subNicheId: req.body?.subNicheId,
        scope: "personal",
        ownerId: me.id,
        sections: {
          strategyDefaults: strategy[0]?.data ?? null,
          configurationDefaults: answers[0]?.data ?? null,
        },
      },
      version: 1,
      status: "active",
      updatedBy: me.id,
    });
    return successBody({ id: saved.recordKey, ...saved.payload });
  });

  app.get<{ Params: { id: string } }>("/projects/:id/template-status", async (req) => {
    const me = await user(req, deps);
    const project = await ownedProject(deps, me.id, req.params.id);
    const appliedId = project.data.appliedTemplateId as string | undefined;
    if (!appliedId) return successBody({ appliedTemplateId: null });
    const template = await platform.getLibraryRecord("niche_template", appliedId);
    return successBody({
      appliedTemplateId: appliedId,
      appliedVersion: project.data.appliedTemplateVersion,
      latestVersion: template?.version ?? null,
      changedSections: [],
    });
  });

  app.get("/annex-templates", async () => {
    const { getAnnexTemplates } = await import("../ai/library.js");
    return successBody(await getAnnexTemplates(platform));
  });
}

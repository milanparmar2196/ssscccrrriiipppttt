import type { FastifyInstance, FastifyRequest } from "fastify";
import { successBody, ApiError } from "../errors.js";
import type { AppDeps } from "../deps.js";
import { requireAdmin } from "../auth/guards.js";
import { hashPassword } from "../auth/passwords.js";
import { getTaxonomy } from "../ai/library.js";
import { PLATFORM_DEFAULTS } from "../platform/settings.js";

type Obj = Record<string, unknown>;

async function actor(deps: AppDeps, req: FastifyRequest): Promise<string> {
  const ctx = await requireAdmin(deps.auth.store, req);
  return ctx.actor ?? ctx.userId;
}

async function audit(deps: AppDeps, actorId: string, action: string, target: string, meta?: Obj) {
  await deps.platform.createArtifact({
    kind: "admin_audit", ownerId: "admin", key: action, versionNo: 1, isCurrent: true,
    data: { actor: actorId, action, target, meta: meta ?? {}, at: new Date().toISOString() },
  }).catch(() => undefined);
}

/** Generic Admin library CRUD over library_records (Admin Spec §8). */
function libraryCrud(
  app: FastifyInstance,
  deps: AppDeps,
  base: string,
  kind: string,
  keyField = "key",
) {
  app.get(base, async (req) => {
    await actor(deps, req);
    const records = await deps.platform.listLibraryRecords(kind);
    const seeded = await seededFor(deps, kind);
    const byKey = new Map<string, Obj>();
    for (const s of seeded) byKey.set(String(s[keyField] ?? s.id), s);
    for (const r of records) {
      if (r.status === "archived") byKey.delete(r.recordKey);
      else byKey.set(r.recordKey, { ...r.payload, _version: r.version, _status: r.status });
    }
    return successBody([...byKey.values()]);
  });
  app.post(base, async (req) => {
    const who = await actor(deps, req);
    const body = (req.body ?? {}) as Obj;
    const key = String(body[keyField] ?? body.id ?? `${kind}-${Date.now()}`);
    const existing = await deps.platform.getLibraryRecord(kind, key);
    const saved = await deps.platform.putLibraryRecord({
      kind, recordKey: key,
      payload: { ...body, [keyField]: key },
      version: (existing?.version ?? 0) + 1,
      status: (body.status as string) ?? "active",
      updatedBy: who,
    });
    await audit(deps, who, `${kind}.upsert`, key);
    return successBody({ key, version: saved.version, ...saved.payload });
  });
  app.patch(`${base}/:key`, async (req) => {
    const who = await actor(deps, req);
    const params = req.params as { key: string };
    const existing = await deps.platform.getLibraryRecord(kind, params.key);
    const body = (req.body ?? {}) as Obj;
    const saved = await deps.platform.putLibraryRecord({
      kind, recordKey: params.key,
      payload: { ...(existing?.payload ?? {}), ...body },
      version: (existing?.version ?? 0) + 1,
      status: (body.status as string) ?? existing?.status ?? "active",
      updatedBy: who,
    });
    await audit(deps, who, `${kind}.update`, params.key);
    return successBody({ key: params.key, version: saved.version, ...saved.payload });
  });
  app.delete(`${base}/:key`, async (req) => {
    const who = await actor(deps, req);
    const params = req.params as { key: string };
    const existing = await deps.platform.getLibraryRecord(kind, params.key);
    await deps.platform.putLibraryRecord({
      kind, recordKey: params.key,
      payload: existing?.payload ?? {},
      version: (existing?.version ?? 0) + 1,
      status: "archived",
      updatedBy: who,
    });
    await audit(deps, who, `${kind}.archive`, params.key);
    return successBody({ archived: true });
  });
}

async function seededFor(deps: AppDeps, kind: string): Promise<Obj[]> {
  const { getFormatProfiles, getAnnexTemplates, getProviders, getProviderModels, getStageAssignments } =
    await import("../ai/library.js");
  switch (kind) {
    case "format_profile": return getFormatProfiles(deps.platform);
    case "annex_template": return getAnnexTemplates(deps.platform);
    case "model_provider": return getProviders(deps.platform);
    case "provider_model": return getProviderModels(deps.platform);
    default: return [];
  }
}

export function registerAdminRoutes(app: FastifyInstance, deps: AppDeps): void {
  const platform = deps.platform;

  /* ---------- users & credits ---------- */
  app.get("/admin/users", async (req) => {
    await actor(deps, req);
    // User records are read through the auth store's public surface:
    // list via ledger-known ids + search is intentionally limited;
    // full directory reads use the DB in production wiring.
    const q = req.query as Obj;
    const all = await deps.auth.store.listUsers(500);
    const filtered = all.filter(
      (u) =>
        (!q.email || u.email.includes(String(q.email))) &&
        (!q.planKey || u.planKey === q.planKey) &&
        (!q.status || u.status === q.status),
    );
    const withBalances = await Promise.all(
      filtered.map(async (u) => ({
        id: u.id, email: u.email, planKey: u.planKey, status: u.status,
        emailVerified: Boolean(u.emailVerifiedAt), createdAt: u.createdAt,
        balance: await deps.auth.store.ledgerBalance(u.id),
      })),
    );
    return successBody(withBalances);
  });

  app.get<{ Params: { id: string } }>("/admin/users/:id", async (req) => {
    await actor(deps, req);
    const found = await deps.auth.store.getUserById(req.params.id);
    if (!found) throw new ApiError("NOT_FOUND", "User not found");
    const balance = await deps.auth.store.ledgerBalance(found.id);
    return successBody({
      id: found.id, email: found.email, planKey: found.planKey,
      status: found.status, emailVerified: Boolean(found.emailVerifiedAt), balance,
    });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/admin/users/:id/suspend", async (req) => {
    const who = await actor(deps, req);
    const found = await deps.auth.store.getUserById(req.params.id);
    if (!found) throw new ApiError("NOT_FOUND", "User not found");
    const suspend = req.body?.suspend !== false;
    const updated = await deps.auth.store.updateUser(found.id, {
      status: suspend ? "suspended" : "active",
    });
    await audit(deps, who, suspend ? "user.suspend" : "user.unsuspend", found.id);
    return successBody({ id: updated.id, status: updated.status });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/admin/users/:id/plan", async (req) => {
    const who = await actor(deps, req);
    const found = await deps.auth.store.getUserById(req.params.id);
    if (!found) throw new ApiError("NOT_FOUND", "User not found");
    const updated = await deps.auth.store.updateUser(found.id, { planKey: String(req.body?.planKey ?? "personal") });
    await audit(deps, who, "user.plan", found.id, { planKey: updated.planKey });
    return successBody({ id: updated.id, planKey: updated.planKey });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/admin/users/:id/credits", async (req) => {
    const who = await actor(deps, req);
    const found = await deps.auth.store.getUserById(req.params.id);
    if (!found) throw new ApiError("NOT_FOUND", "User not found");
    const amount = Number(req.body?.amount ?? 0);
    if (!amount || !req.body?.reason) {
      throw new ApiError("VALIDATION", "Credit adjustments need an amount and a reason (ledger grant — balances are never edited directly)");
    }
    const entry = await deps.auth.store.addLedgerEntry({
      userId: found.id, kind: "grant", amount, note: String(req.body.reason), actor: who,
    });
    await audit(deps, who, "user.credits.grant", found.id, { amount });
    return successBody({ entryId: entry.id, balance: await deps.auth.store.ledgerBalance(found.id) });
  });

  /* ---------- admin users (A9) ---------- */
  app.get("/admin/admin-users", async (req) => {
    await actor(deps, req);
    const admins = await deps.auth.store.listAdminUsers();
    return successBody({
      count: admins.length,
      admins: admins.map((a) => ({
        id: a.id, email: a.email, role: a.role, status: a.status, mfaEnabled: a.mfaEnabled,
      })),
    });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/admin/admin-users/:id/deactivate", async (req) => {
    const ctx = await requireAdmin(deps.auth.store, req);
    if (ctx.role !== "super_admin" && ctx.actor !== "bootstrap") {
      throw new ApiError("FORBIDDEN", "Only super-admins can deactivate admin users");
    }
    const admins = await deps.auth.store.listAdminUsers();
    const target = admins.find((a) => a.id === req.params.id);
    if (!target) throw new ApiError("NOT_FOUND", "Admin user not found");
    const updated = await deps.auth.store.updateAdminUser(target.id, { status: "disabled" });
    await audit(deps, ctx.actor ?? ctx.userId, "admin_user.deactivate", target.email);
    return successBody({ id: updated.id, status: updated.status });
  });

  app.post<{ Body: Obj }>("/admin/admin-users", async (req) => {
    const ctx = await requireAdmin(deps.auth.store, req);
    if (ctx.role !== "super_admin" && ctx.actor !== "bootstrap") {
      throw new ApiError("FORBIDDEN", "Only super-admins can create admin users");
    }
    const body = req.body ?? {};
    const created = await deps.auth.store.createAdminUser({
      email: String(body.email ?? "").toLowerCase(),
      passwordHash: hashPassword(String(body.password ?? "")),
      role: body.role === "super_admin" ? "super_admin" : "admin",
      status: "active",
      mfaEnabled: false,
    });
    await audit(deps, ctx.actor ?? ctx.userId, "admin_user.create", created.email);
    return successBody({ id: created.id, email: created.email, role: created.role });
  });

  /* ---------- taxonomy / presets / questions ---------- */
  app.get("/admin/taxonomy", async (req) => {
    await actor(deps, req);
    return successBody(await getTaxonomy(platform));
  });
  libraryCrud(app, deps, "/admin/taxonomy/records", "taxonomy", "id");
  libraryCrud(app, deps, "/admin/presets/:kind", "preset_dynamic");

  app.get("/admin/config-questions", async (req) => {
    await actor(deps, req);
    const { getConfigQuestions } = await import("../ai/library.js");
    return successBody(await getConfigQuestions(platform));
  });
  libraryCrud(app, deps, "/admin/config-questions/records", "config_question");

  app.post<{ Params: { id: string } }>("/admin/config-questions/:id/publish", async (req) => {
    const who = await actor(deps, req);
    let existing = await platform.getLibraryRecord("config_question", req.params.id);
    if (!existing) {
      // Seed-only question: materialise it into the library first so
      // the publish creates a real new version (§6A publish semantics).
      const { getConfigQuestions } = await import("../ai/library.js");
      const questions = await getConfigQuestions(platform);
      const seed = questions.find(
        (q) => String(q.key) === req.params.id || String(q.id) === req.params.id,
      );
      if (!seed) throw new ApiError("NOT_FOUND", "Question not found");
      existing = await platform.putLibraryRecord({
        kind: "config_question", recordKey: req.params.id,
        payload: seed, version: Number(seed.version ?? 1), status: "draft", updatedBy: who,
      });
    }
    const saved = await platform.putLibraryRecord({
      ...existing, version: existing.version + 1, status: "active", updatedBy: who,
      payload: { ...existing.payload, version: existing.version + 1 },
    });
    await audit(deps, who, "config_question.publish", req.params.id, { version: saved.version });
    return successBody({ key: req.params.id, version: saved.version, status: "active" });
  });

  app.post<{ Params: { nicheId: string }; Body: Obj }>(
    "/admin/niches/:nicheId/questions",
    async (req) => {
      const who = await actor(deps, req);
      const body = req.body ?? {};
      const questionId = String(body.questionId ?? "");
      const mode = body.mode === "clone" ? "clone" : "assign";
      const key = `${req.params.nicheId}:${questionId}${mode === "clone" ? `:clone-${Date.now()}` : ""}`;
      const saved = await platform.putLibraryRecord({
        kind: "niche_question", recordKey: key,
        payload: { questionId, mode, overrides: body.overrides ?? {}, nicheId: req.params.nicheId },
        version: 1, status: "active", updatedBy: who,
      });
      return successBody({ assignmentId: saved.recordKey, mode });
    },
  );

  app.delete<{ Params: { nicheId: string; assignmentId: string } }>(
    "/admin/niches/:nicheId/questions/:assignmentId",
    async (req) => {
      await actor(deps, req);
      await platform.deleteLibraryRecord("niche_question", req.params.assignmentId);
      return successBody({ removed: true });
    },
  );

  /* ---------- angles (per niche) ---------- */
  app.get<{ Params: { nicheId: string } }>("/admin/niches/:nicheId/angles", async (req) => {
    await actor(deps, req);
    const { getAnglesForTarget } = await import("../ai/library.js");
    return successBody(await getAnglesForTarget(platform, req.params.nicheId));
  });

  app.post<{ Params: { nicheId: string }; Body: Obj }>("/admin/niches/:nicheId/angles", async (req) => {
    const who = await actor(deps, req);
    const body = req.body ?? {};
    const { getAnglesForTarget } = await import("../ai/library.js");
    const existing = await getAnglesForTarget(platform, req.params.nicheId);
    const slug = String(body.slug ?? "");
    if (existing.some((a) => a.slug === slug && a.status !== "archived")) {
      throw new ApiError("CONFLICT", `Slug ${slug} already exists on this niche`);
    }
    const angle: Obj = {
      id: `angle-${Date.now()}`,
      targetType: body.targetType ?? "niche",
      targetId: req.params.nicheId,
      slug,
      angle: body.angle ?? "",
      question: body.question,
      scope: body.scope,
      evidence: body.evidence,
      boundary: body.boundary,
      completeness:
        body.question && body.scope && body.evidence && body.boundary ? "complete" : "title_only",
      status: "active",
      version: 1,
    };
    await platform.putLibraryRecord({
      kind: "angle", recordKey: `${req.params.nicheId}:${slug}`,
      payload: angle, version: 1, status: "active", updatedBy: who,
    });
    await audit(deps, who, "angle.create", `${req.params.nicheId}:${slug}`);
    return successBody(angle);
  });

  app.patch<{ Params: { nicheId: string; angleId: string }; Body: Obj }>(
    "/admin/niches/:nicheId/angles/:angleId",
    async (req) => {
      const who = await actor(deps, req);
      const records = await platform.listLibraryRecords("angle");
      const record = records.find(
        (r) => (r.payload.id as string) === req.params.angleId || r.recordKey.endsWith(`:${req.params.angleId}`),
      );
      const payload = { ...(record?.payload ?? {}), ...(req.body ?? {}) };
      payload.version = Number(payload.version ?? 1) + 1;
      payload.completeness =
        payload.question && payload.scope && payload.evidence && payload.boundary
          ? "complete"
          : payload.completeness ?? "title_only";
      // AI suggestions are drafts: clear them once a human edits fields.
      if (req.body?.question || req.body?.scope || req.body?.evidence || req.body?.boundary) {
        payload.suggestedFields = undefined;
      }
      await platform.putLibraryRecord({
        kind: "angle",
        recordKey: record?.recordKey ?? `${req.params.nicheId}:${String(payload.slug ?? req.params.angleId)}`,
        payload, version: Number(payload.version), status: "active", updatedBy: who,
      });
      return successBody(payload);
    },
  );

  app.delete<{ Params: { nicheId: string; angleId: string } }>(
    "/admin/niches/:nicheId/angles/:angleId",
    async (req) => {
      const who = await actor(deps, req);
      const records = await platform.listLibraryRecords("angle");
      const record = records.find(
        (r) => (r.payload.id as string) === req.params.angleId || r.recordKey.endsWith(`:${req.params.angleId}`),
      );
      // Archive, never hard-delete, when any run references the angle.
      const runs = await platform.listRunsForOwner("").catch(() => []);
      void runs;
      if (record) {
        await platform.putLibraryRecord({
          ...record, status: "archived", updatedBy: who,
          payload: { ...record.payload, status: "archived" },
        });
      }
      await audit(deps, who, "angle.archive", req.params.angleId);
      return successBody({ archived: true });
    },
  );

  /* ---------- templates / annexes / format profiles / providers ---------- */
  libraryCrud(app, deps, "/admin/niche-templates", "niche_template", "id");
  libraryCrud(app, deps, "/admin/annex-templates", "annex_template", "key");
  libraryCrud(app, deps, "/admin/format-profiles", "format_profile", "key");
  libraryCrud(app, deps, "/admin/model-providers", "model_provider", "key");
  libraryCrud(app, deps, "/admin/provider-models", "provider_model", "id");
  libraryCrud(app, deps, "/admin/prompt-templates", "prompt_template", "stage");

  app.post<{ Params: { id: string } }>("/admin/model-providers/:id/test", async (req) => {
    await actor(deps, req);
    const providers = await (await import("../ai/library.js")).getProviders(platform);
    const provider = providers.find((p) => p.key === req.params.id);
    if (!provider) throw new ApiError("NOT_FOUND", "Provider not found");
    const envKeyName = String(provider.envKeyName ?? "");
    const configured = Boolean(envKeyName && process.env[envKeyName]);
    return successBody({
      provider: req.params.id,
      keyConfigured: configured,
      status: configured ? "key_present — live calls are exercised by generation jobs" : "not_configured",
    });
  });

  app.get("/admin/model-assignments", async (req) => {
    await actor(deps, req);
    const { getStageAssignments } = await import("../ai/library.js");
    return successBody(await getStageAssignments(platform));
  });

  app.put<{ Body: Obj }>("/admin/model-assignments", async (req) => {
    const who = await actor(deps, req);
    const assignments = (req.body?.assignments as Obj[]) ?? [];
    for (const a of assignments) {
      await platform.putLibraryRecord({
        kind: "model_assignment", recordKey: String(a.stage),
        payload: a, version: 1, status: "active", updatedBy: who,
      });
    }
    await audit(deps, who, "model_assignments.update", "all");
    return successBody({ updated: assignments.length });
  });

  app.get("/admin/similarity-thresholds", async (req) => {
    await actor(deps, req);
    return successBody(
      (await platform.getSetting("similarityThresholds")) ?? PLATFORM_DEFAULTS.similarityThresholds,
    );
  });

  app.put<{ Body: Obj }>("/admin/similarity-thresholds", async (req) => {
    const who = await actor(deps, req);
    await platform.setSetting("similarityThresholds", req.body ?? {});
    await audit(deps, who, "similarity_thresholds.update", "thresholds");
    return successBody(req.body ?? {});
  });

  app.post<{ Body: Obj }>("/admin/embeddings/reindex", async (req) => {
    await actor(deps, req);
    // Reindex runs as an embedding_index job per owner scope; here we
    // record the request for the job runner (Admin-triggered).
    const record = await platform.createArtifact({
      kind: "reindex_request", ownerId: "admin", versionNo: 1, isCurrent: true,
      status: "queued", data: { scope: req.body?.scope ?? "all", at: new Date().toISOString() },
    });
    return successBody({ requestId: record.id, status: "queued" });
  });

  /* ---------- source library (§6B) ---------- */
  libraryCrud(app, deps, "/admin/source-library", "source_library", "id");
  libraryCrud(app, deps, "/admin/source-bundles", "source_bundle", "id");

  app.post<{ Params: { id: string }; Body: Obj }>("/admin/source-bundles/:id/apply", async (req) => {
    const who = await actor(deps, req);
    const bundle = await platform.getLibraryRecord("source_bundle", req.params.id);
    if (!bundle) throw new ApiError("NOT_FOUND", "Bundle not found");
    if (!bundle.payload.reviewed) {
      throw new ApiError("VALIDATION", "A bundle must be marked reviewed before it can be applied");
    }
    const entryIds = (bundle.payload.entryIds as string[]) ?? [];
    if (req.body?.projectId) {
      for (const entryId of entryIds) {
        const entry = await platform.getLibraryRecord("source_library", entryId);
        if (entry) {
          await platform.createArtifact({
            kind: "master_list_entry", ownerId: who, projectId: String(req.body.projectId),
            key: "sourceList", versionNo: 1, isCurrent: true,
            data: { ...entry.payload, libraryEntryId: entryId },
          });
        }
      }
    }
    await audit(deps, who, "source_bundle.apply", req.params.id);
    return successBody({ applied: entryIds.length });
  });

  app.get("/admin/niche-coverage", async (req) => {
    await actor(deps, req);
    const records = await platform.listLibraryRecords("niche_coverage");
    const gapLogs = await platform.listArtifacts({ kind: "niche_gap_log" });
    return successBody({
      coverage: records.map((r) => ({ nicheId: r.recordKey, ...r.payload })),
      gapCount: gapLogs.length,
    });
  });

  app.patch<{ Params: { nicheId: string }; Body: Obj }>(
    "/admin/niche-coverage/:nicheId",
    async (req) => {
      const who = await actor(deps, req);
      const saved = await platform.putLibraryRecord({
        kind: "niche_coverage", recordKey: req.params.nicheId,
        payload: { ...(req.body ?? {}), reviewedBy: who, reviewedAt: new Date().toISOString() },
        version: 1, status: "active", updatedBy: who,
      });
      return successBody({ nicheId: req.params.nicheId, ...saved.payload });
    },
  );

  app.get("/admin/source-review-queue", async (req) => {
    await actor(deps, req);
    const records = await platform.listLibraryRecords("source_library");
    return successBody(
      records
        .filter((r) => (r.payload.reviewStatus as string) === "pending")
        .map((r) => ({ id: r.recordKey, ...r.payload })),
    );
  });

  /* ---------- plans, packs, flags, settings ---------- */
  libraryCrud(app, deps, "/admin/plans", "plan", "key");
  libraryCrud(app, deps, "/admin/credit-packs", "credit_pack", "key");

  app.get("/admin/feature-flags", async (req) => {
    await actor(deps, req);
    return successBody((await platform.getSetting("featureFlags")) ?? PLATFORM_DEFAULTS.featureFlags);
  });

  app.put<{ Body: Obj }>("/admin/feature-flags", async (req) => {
    const who = await actor(deps, req);
    await platform.setSetting("featureFlags", req.body ?? {});
    await audit(deps, who, "feature_flags.update", "flags");
    return successBody(req.body ?? {});
  });

  app.get("/admin/settings", async (req) => {
    await actor(deps, req);
    return successBody({
      jobCosts: (await platform.getSetting("jobCosts")) ?? PLATFORM_DEFAULTS.jobCosts,
      auditPassThreshold:
        (await platform.getSetting("auditPassThreshold")) ?? PLATFORM_DEFAULTS.auditPassThreshold,
      concurrentJobCap:
        (await platform.getSetting("concurrentJobCap")) ?? PLATFORM_DEFAULTS.concurrentJobCap,
    });
  });

  app.put<{ Body: Obj }>("/admin/settings", async (req) => {
    const who = await actor(deps, req);
    const body = req.body ?? {};
    for (const key of ["jobCosts", "auditPassThreshold", "concurrentJobCap", "auditWeightsStandard", "auditWeightsBrand"]) {
      if (body[key] !== undefined) await platform.setSetting(key, body[key]);
    }
    await audit(deps, who, "settings.update", "platform");
    return successBody({ updated: true });
  });

  /* ---------- jobs oversight, safety queue, audit log ---------- */
  app.get("/admin/jobs", async (req) => {
    await actor(deps, req);
    const q = req.query as Obj;
    const jobs = await platform.listJobs({ status: q.status ? String(q.status) : undefined });
    return successBody(jobs.slice(0, 100).map((j) => ({
      id: j.id, action: j.action, status: j.status, userId: j.userId,
      runId: j.runId, creditsCharged: j.creditsCharged, createdAt: j.createdAt,
    })));
  });

  app.post<{ Params: { id: string } }>("/admin/jobs/:id/cancel", async (req) => {
    const who = await actor(deps, req);
    const job = await platform.getJob(req.params.id);
    if (!job) throw new ApiError("NOT_FOUND", "Job not found");
    const { cancelJob } = await import("../jobs/engine.js");
    const updated = await cancelJob(deps, job);
    await audit(deps, who, "job.cancel", job.id);
    return successBody({ id: updated.id, status: updated.status });
  });

  app.get("/admin/safety-queue", async (req) => {
    await actor(deps, req);
    const gapLogs = await platform.listArtifacts({ kind: "niche_gap_log" });
    const scenes = await platform.listArtifacts({ kind: "scene" });
    const vizScenes = scenes.filter((s) => s.data.dataVizRequest);
    const openIssueRuns = (await platform.listAllRuns()).filter((r) => r.openIssues.length > 0);
    return successBody({
      researchGaps: gapLogs.length,
      dataVizRequests: vizScenes.length,
      items: {
        gaps: gapLogs.slice(0, 50).map((g) => ({
          id: g.id, nicheId: g.key, projectId: g.projectId, runId: g.data.runId, at: g.data.at,
          gaps: g.data.gaps,
        })),
        dataViz: vizScenes.slice(0, 50).map((s) => ({
          id: s.id, runId: s.runId, sceneNo: s.data.sceneNo, request: s.data.dataVizRequest,
        })),
        openIssues: openIssueRuns.slice(0, 50).map((r) => ({
          runId: r.id, projectId: r.projectId, ownerId: r.ownerId,
          openIssues: r.openIssues.filter((i) => i.status === "open"),
        })),
      },
    });
  });

  /* ---------- project/run monitoring (Admin Spec S6) ---------- */
  app.get("/admin/projects", async (req) => {
    await actor(deps, req);
    const q = req.query as Obj;
    const all = await platform.listAllProjects();
    const filtered = all.filter(
      (p) =>
        (!q.ownerId || p.ownerId === q.ownerId) &&
        (!q.status || p.lifecycleStatus === q.status) &&
        (!q.type || p.type === q.type),
    );
    return successBody(filtered.slice(0, 200).map((p) => ({
      id: p.id, ownerId: p.ownerId, type: p.type, name: p.name,
      lifecycleStatus: p.lifecycleStatus, isSample: p.isSample, updatedAt: p.updatedAt,
    })));
  });

  app.get("/admin/runs", async (req) => {
    await actor(deps, req);
    const q = req.query as Obj;
    const all = await platform.listAllRuns();
    const filtered = all.filter(
      (r) =>
        (!q.projectId || r.projectId === q.projectId) &&
        (!q.ownerId || r.ownerId === q.ownerId) &&
        (!q.status || r.lifecycleStatus === q.status),
    );
    return successBody(filtered.slice(0, 200).map((r) => ({
      id: r.id, projectId: r.projectId, ownerId: r.ownerId, title: r.title,
      lifecycleStatus: r.lifecycleStatus, stageMap: r.stageMap,
      openIssues: r.openIssues.filter((i) => i.status === "open").length,
      updatedAt: r.updatedAt,
    })));
  });

  app.get("/admin/audit-log", async (req) => {
    await actor(deps, req);
    const rows = await platform.listArtifacts({ kind: "admin_audit", ownerId: "admin" });
    return successBody(
      rows
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 100)
        .map((r) => ({ id: r.id, ...r.data })),
    );
  });
}

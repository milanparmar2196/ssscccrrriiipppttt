import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { ApiError, successBody } from "../errors.js";
import type { AppDeps } from "../deps.js";
import { requireUser } from "../auth/guards.js";
import { user } from "../routes/helpers.js";
import { cancelJob, estimateCredits } from "../jobs/engine.js";
import { hashSecret } from "./notify.js";
import { PLATFORM_DEFAULTS } from "./settings.js";
import { LocalStorage } from "./storage.js";
import { duplicateSample } from "../projects/sample.js";

type Obj = Record<string, unknown>;

/* ---- YouTube token encryption (A10: AES-256-GCM, key from .env) ---- */
function encryptionKey(): Buffer | undefined {
  const raw = process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY;
  if (!raw) return undefined;
  return createHash("sha256").update(raw).digest();
}
export function encryptTokens(payload: unknown): string {
  const key = encryptionKey();
  if (!key) throw new ApiError("FEATURE_DISABLED", "YOUTUBE_TOKEN_ENCRYPTION_KEY is not configured");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), data.toString("hex")].join(":");
}
export function decryptTokens<T>(envelope: string): T {
  const key = encryptionKey();
  if (!key) throw new Error("Encryption key not configured");
  const [iv, tag, data] = envelope.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv!, "hex"));
  decipher.setAuthTag(Buffer.from(tag!, "hex"));
  return JSON.parse(
    Buffer.concat([decipher.update(Buffer.from(data!, "hex")), decipher.final()]).toString("utf8"),
  ) as T;
}

export function registerPlatformRoutes(app: FastifyInstance, deps: AppDeps): void {
  const platform = deps.platform;

  /* ---------- jobs (§7) ---------- */
  app.post<{ Body: Obj }>("/jobs/estimate", async (req) => {
    const me = await user(req, deps);
    void me;
    const action = String(req.body?.action ?? "");
    const estimate = await estimateCredits(deps, action, (req.body?.params as Obj) ?? {});
    return successBody(estimate);
  });

  app.get<{ Params: { jobId: string } }>("/jobs/:jobId", async (req) => {
    const me = await user(req, deps);
    const job = await platform.getJob(req.params.jobId);
    if (!job || job.userId !== me.id) throw new ApiError("NOT_FOUND", "Job not found");
    return successBody({
      id: job.id, action: job.action, status: job.status,
      progressPct: job.progressPct, resultRefs: job.resultRefs,
      result: job.result, creditsCharged: job.creditsCharged,
      estimatedCredits: job.estimatedCredits, error: job.error,
      modelUsed: job.modelUsed,
    });
  });

  app.get("/jobs", async (req) => {
    const me = await user(req, deps);
    const q = req.query as Obj;
    const jobs = await platform.listJobs({
      userId: me.id,
      runId: q.runId ? String(q.runId) : undefined,
      projectId: q.projectId ? String(q.projectId) : undefined,
    });
    return successBody(jobs.map((j) => ({
      id: j.id, action: j.action, status: j.status, creditsCharged: j.creditsCharged,
      createdAt: j.createdAt,
    })));
  });

  app.post<{ Params: { jobId: string } }>("/jobs/:jobId/cancel", async (req) => {
    const me = await user(req, deps);
    const job = await platform.getJob(req.params.jobId);
    if (!job || job.userId !== me.id) throw new ApiError("NOT_FOUND", "Job not found");
    const updated = await cancelJob(deps, job);
    return successBody({ id: updated.id, status: updated.status });
  });

  /* ---------- uploads (A10 two-step) ---------- */
  app.post<{ Body: Obj }>("/uploads/init", async (req) => {
    const me = await user(req, deps);
    const body = req.body ?? {};
    const purpose = String(body.purpose ?? "other");
    const contentType = String(body.contentType ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);
    const maxBytes = (await platform.getSetting<Record<string, number>>("uploadMaxBytes")) ??
      PLATFORM_DEFAULTS.uploadMaxBytes;
    const allowed: string[] = (await platform.getSetting<string[]>("uploadAllowedTypes")) ??
      [...PLATFORM_DEFAULTS.uploadAllowedTypes];
    if (!allowed.includes(contentType)) {
      throw new ApiError("VALIDATION", `Content type ${contentType} is not allowed`);
    }
    if (sizeBytes > (maxBytes[purpose] ?? maxBytes.other ?? 0)) {
      throw new ApiError("VALIDATION", "File exceeds the per-purpose size limit", {
        maxBytes: maxBytes[purpose],
      });
    }
    const record = await platform.createArtifact({
      kind: "upload", ownerId: me.id, versionNo: 1, isCurrent: true, status: "initiated",
      data: {
        filename: body.filename, contentType, sizeBytes, purpose,
        storageKey: `uploads/${me.id}/${Date.now()}-${String(body.filename ?? "file")}`,
        createdAt: new Date().toISOString(),
      },
    });
    const presignedUrl = await deps.storage.presignedPutUrl(String(record.data.storageKey), contentType);
    return successBody({
      uploadId: record.id,
      presignedUrl,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
  });

  app.put<{ Params: { key: string } }>("/uploads/local/:key", async (req) => {
    // Local-storage upload sink (dev). S3 mode uses presigned URLs directly.
    if (!(deps.storage instanceof LocalStorage)) {
      throw new ApiError("FEATURE_DISABLED", "Direct upload sink is only for local storage");
    }
    const key = decodeURIComponent(req.params.key);
    const body = req.body as Buffer;
    await deps.storage.put(key, Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? "")));
    return successBody({ stored: true });
  });

  app.post<{ Params: { id: string }; Body: Obj }>("/uploads/:id/complete", async (req) => {
    const me = await user(req, deps);
    const record = await platform.getArtifact(req.params.id);
    if (!record || record.ownerId !== me.id || record.kind !== "upload") {
      throw new ApiError("NOT_FOUND", "Upload not found");
    }
    const expected = String(req.body?.checksumSha256 ?? "");
    let actual = "";
    try {
      const bytes = await deps.storage.get(String(record.data.storageKey));
      actual = createHash("sha256").update(bytes).digest("hex");
    } catch {
      await platform.updateArtifact(record.id, { status: "failed" });
      throw new ApiError("VALIDATION", "Uploaded bytes not found in storage");
    }
    if (expected && expected !== actual) {
      await platform.updateArtifact(record.id, { status: "failed" });
      throw new ApiError("VALIDATION", "Checksum mismatch — upload failed verification");
    }
    const updated = await platform.updateArtifact(record.id, {
      status: "verified",
      data: { ...record.data, checksumSha256: actual, scanStatus: "not_configured" },
    });
    return successBody({ id: updated.id, status: "verified", checksumSha256: actual, scanStatus: "not_configured" });
  });

  /* ---------- notifications ---------- */
  app.get("/me/notifications", async (req) => {
    const me = await user(req, deps);
    const rows = await platform.listArtifacts({ kind: "notification", ownerId: me.id });
    return successBody(
      rows
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 50)
        .map((r) => ({ id: r.id, status: r.status, ...r.data })),
    );
  });

  app.post<{ Params: { id: string } }>("/me/notifications/:id/read", async (req) => {
    const me = await user(req, deps);
    const row = await platform.getArtifact(req.params.id);
    if (!row || row.ownerId !== me.id) throw new ApiError("NOT_FOUND", "Notification not found");
    await platform.updateArtifact(row.id, { status: "read" });
    return successBody({ read: true });
  });

  /* ---------- webhooks (A10) ---------- */
  app.get("/me/webhooks", async (req) => {
    const me = await user(req, deps);
    const subs = await deps.extras.listWebhooks(me.id);
    return successBody(subs.map((s) => ({
      id: s.id, url: s.url, events: s.events, enabled: s.enabled, failureCount: s.failureCount,
    })));
  });

  app.post<{ Body: Obj }>("/me/webhooks", async (req) => {
    const me = await user(req, deps);
    const secret = randomBytes(24).toString("hex");
    const saved = await deps.extras.createWebhook({
      userId: me.id,
      url: String(req.body?.url ?? ""),
      events: (req.body?.events as string[]) ?? ["job_done", "job_failed"],
      secretHash: hashSecret(secret),
      enabled: true,
    });
    // The secret is shown exactly once (A10) — only its hash is stored.
    return successBody({ id: saved.id, url: saved.url, events: saved.events, secret });
  });

  app.delete<{ Params: { id: string } }>("/me/webhooks/:id", async (req) => {
    const me = await user(req, deps);
    const sub = await deps.extras.getWebhook(req.params.id);
    if (!sub || sub.userId !== me.id) throw new ApiError("NOT_FOUND", "Webhook not found");
    await deps.extras.deleteWebhook(sub.id);
    return successBody({ deleted: true });
  });

  /* ---------- sample project ---------- */
  app.post("/projects/sample/duplicate", async (req) => {
    const me = await user(req, deps);
    const projectId = await duplicateSample(deps, me.id);
    return successBody({ projectId });
  });

  /* ---------- YouTube (A10) ---------- */
  app.get("/me/youtube", async (req) => {
    const me = await user(req, deps);
    const conn = await deps.extras.getYoutube(me.id);
    if (!conn || conn.status === "disconnected") return successBody({ connected: false });
    return successBody({
      connected: true,
      channelId: conn.channelId,
      channelTitle: conn.channelTitle,
      scopes: conn.scopes,
      syncStatus: conn.syncStatus,
      lastSyncedAt: conn.lastSyncedAt,
      lastError: conn.lastError,
    });
  });

  app.post<{ Body: Obj }>("/me/youtube/connect", async (req) => {
    const me = await user(req, deps);
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI;
    if (!clientId || !redirectUri || !process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY) {
      throw new ApiError(
        "FEATURE_DISABLED",
        "YouTube OAuth is not configured on the server (client id/secret, redirect URI, encryption key)",
      );
    }
    const state = createHash("sha256").update(`${me.id}:${randomBytes(16).toString("hex")}`).digest("hex");
    await platform.createArtifact({
      kind: "oauth_state", ownerId: me.id, key: "youtube", versionNo: 1, isCurrent: true,
      data: { state, createdAt: new Date().toISOString() },
    });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return successBody({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  app.get<{ Querystring: Obj }>("/me/youtube/callback", async (req) => {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    const states = await platform.listArtifacts({ kind: "oauth_state", key: "youtube" });
    const match = states.find((s) => s.data.state === state);
    if (!match || !code) throw new ApiError("VALIDATION", "Invalid OAuth state or missing code");
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
        client_secret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI ?? "",
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new ApiError("VALIDATION", "YouTube token exchange failed");
    const tokens = (await tokenRes.json()) as Obj;
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { authorization: `Bearer ${String(tokens.access_token)}` } },
    );
    const channelData = (await channelRes.json()) as Obj;
    const channel = ((channelData.items as Obj[]) ?? [])[0];
    await deps.extras.upsertYoutube({
      userId: match.ownerId,
      channelId: channel ? String(channel.id) : undefined,
      channelTitle: channel ? String(((channel.snippet as Obj)?.title as string) ?? "") : undefined,
      scopes: ["youtube.readonly", "yt-analytics.readonly"],
      tokensEncrypted: encryptTokens(tokens),
      status: "connected",
      syncStatus: "idle",
    });
    return successBody({ connected: true });
  });

  app.delete("/me/youtube", async (req) => {
    const me = await user(req, deps);
    const conn = await deps.extras.getYoutube(me.id);
    if (conn?.tokensEncrypted) {
      try {
        const tokens = decryptTokens<Obj>(conn.tokensEncrypted);
        await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: String(tokens.refresh_token ?? tokens.access_token ?? "") }),
        });
      } catch {
        /* revocation best-effort; local deletion proceeds */
      }
    }
    await deps.extras.deleteYoutube(me.id);
    // Synced metrics stay on their records, marked disconnected.
    const records = await platform.listArtifacts({ kind: "performance_record", ownerId: me.id, currentOnly: true });
    for (const r of records) {
      if (r.data.syncStatus === "synced") {
        await platform.updateArtifact(r.id, { data: { ...r.data, syncStatus: "disconnected" } });
      }
    }
    return successBody({ disconnected: true });
  });

  app.post<{ Params: { runId: string } }>("/runs/:runId/performance/sync", async (req) => {
    const me = await requireUser(deps.auth.store, req);
    const run = await platform.getRun(req.params.runId);
    if (!run || run.ownerId !== me.id) throw new ApiError("NOT_FOUND", "Run not found");
    const record = await platform.listArtifacts({ kind: "performance_record", runId: run.id, currentOnly: true });
    const current = record[0];
    const videoId = current?.data.youtubeVideoId as string | undefined;
    if (!videoId) {
      throw new ApiError("VALIDATION", "No youtubeVideoId set on the performance record — matching is never guessed", {
        error: "no_video_match",
      });
    }
    const conn = await deps.extras.getYoutube(me.id);
    if (!conn || conn.status !== "connected" || !conn.tokensEncrypted) {
      throw new ApiError("VALIDATION", "YouTube is not connected for this account");
    }
    const tokens = decryptTokens<Obj>(conn.tokensEncrypted);
    const analyticsUrl =
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE` +
      `&startDate=2005-01-01&endDate=2100-01-01&metrics=views,likes,comments,shares,averageViewDuration,estimatedMinutesWatched` +
      `&dimensions=video&filters=video==${encodeURIComponent(videoId)}`;
    const res = await fetch(analyticsUrl, {
      headers: { authorization: `Bearer ${String(tokens.access_token)}` },
    });
    if (res.status === 403) {
      await deps.extras.upsertYoutube({ ...conn, syncStatus: "quota_exceeded", lastError: "quota" });
      throw new ApiError("RATE_LIMITED", "YouTube API quota exceeded — retry later", { syncStatus: "quota_exceeded" });
    }
    if (res.status === 401) {
      await deps.extras.upsertYoutube({ ...conn, syncStatus: "reauth_required", lastError: "invalid grant" });
      throw new ApiError("UNAUTHORIZED", "YouTube grant expired — reconnect the channel");
    }
    if (!res.ok) throw new ApiError("INTERNAL", `YouTube Analytics HTTP ${res.status}`);
    const data = (await res.json()) as Obj;
    const headers = (data.columnHeaders as Obj[] | undefined) ?? [];
    const row = ((data.rows as unknown[][]) ?? [])[0] ?? [];
    const metrics: Obj = { youtubeVideoId: videoId, syncStatus: "synced", syncedAt: new Date().toISOString(), source: "youtube_api" };
    headers.forEach((h, i) => {
      metrics[String(h.name)] = row[i];
    });
    const { saveVersioned } = await import("../runs/data.js");
    const saved = await saveVersioned(platform, {
      kind: "performance_record", ownerId: me.id, projectId: run.projectId, runId: run.id,
      data: { ...(current?.data ?? {}), ...metrics },
    });
    await deps.extras.upsertYoutube({ ...conn, syncStatus: "idle", lastSyncedAt: new Date().toISOString() });
    const patch = setStageSimple(run);
    void patch;
    return successBody({ synced: true, recordId: saved.id, metrics });
  });

  /* ---------- local signed file download ---------- */
  app.get<{ Params: { key: string }; Querystring: Obj }>("/files/:key", async (req, reply) => {
    if (deps.storage instanceof LocalStorage) {
      const key = decodeURIComponent(req.params.key);
      const exp = Number(req.query.exp);
      const sig = String(req.query.sig ?? "");
      if (!deps.storage.verifySigned(key, exp, sig)) {
        throw new ApiError("FORBIDDEN", "Invalid or expired file link");
      }
      const bytes = await deps.storage.get(key);
      return reply.header("content-type", "application/octet-stream").send(bytes);
    }
    throw new ApiError("NOT_FOUND", "File route is only used with local storage");
  });
}

function setStageSimple(run: unknown): unknown {
  return run;
}

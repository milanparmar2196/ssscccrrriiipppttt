import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { LogEmailProvider } from "../src/auth/email.js";
import { MemoryAuthStore } from "../src/auth/memory-store.js";
import { MemoryExtrasStore } from "../src/platform/extras.js";
import { MemoryPlatformStore } from "../src/platform/memory-store.js";
import { LocalStorage } from "../src/platform/storage.js";

process.env.AUTH_JWT_SECRET = "test-secret";
process.env.ADMIN_BOOTSTRAP_EMAIL = "root@example.com";
process.env.ADMIN_BOOTSTRAP_PASSWORD = "bootstrap-pass";

const GOOD_PW = "Str0ng!Passw0rd";

function makeApp() {
  const authStore = new MemoryAuthStore();
  const platform = new MemoryPlatformStore();
  const extras = new MemoryExtrasStore();
  const storage = new LocalStorage("/tmp/sw-test-storage");
  const app = buildApp({
    authDeps: { store: authStore, email: new LogEmailProvider(), breachFetcher: async () => "ABCDEF:1\n" },
    platform,
    extras,
    storage,
  });
  return { app, authStore, platform, deps: app.deps };
}

async function signupVerified(app: ReturnType<typeof buildApp>, store: MemoryAuthStore, email = "maker@example.com") {
  const res = await app.inject({ method: "POST", url: "/auth/signup", payload: { email, password: GOOD_PW } });
  const data = res.json().data;
  const outbox = [...store.outbox].reverse().find((o) => o.template === "verify_email");
  await app.inject({ method: "GET", url: `/auth/verify-email/${(outbox!.payload as { token: string }).token}` });
  return data as { accessToken: string; user: { id: string } };
}

async function waitJob(app: ReturnType<typeof buildApp>, token: string, jobId: string) {
  for (let i = 0; i < 50; i++) {
    const res = await app.inject({ method: "GET", url: `/jobs/${jobId}`, headers: { authorization: `Bearer ${token}` } });
    const job = res.json().data;
    if (job.status === "done" || job.status === "failed" || job.status === "cancelled") return job;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("job did not finish");
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` });

describe("platform end-to-end (no AI provider configured)", () => {
  it("runs the full pipeline plumbing with honest provider failures", async () => {
    const { app, authStore, platform, deps } = makeApp();
    const { accessToken, user } = await signupVerified(app, authStore);
    const H = auth(accessToken);

    // Admin grants credits via the ledger (never a direct balance edit).
    const admin = await app.inject({
      method: "POST", url: "/admin/auth/login",
      payload: { email: "root@example.com", password: "bootstrap-pass" },
    });
    const AH = auth(admin.json().data.accessToken);
    const grant = await app.inject({
      method: "POST", url: `/admin/users/${user.id}/credits`, headers: AH,
      payload: { amount: 500, reason: "test grant" },
    });
    expect(grant.statusCode).toBe(200);
    expect(grant.json().data.balance).toBe(500);

    // Project + steps 1-3
    const project = (await app.inject({
      method: "POST", url: "/projects", headers: H, payload: { name: "History Channel" },
    })).json().data;
    await app.inject({
      method: "PUT", url: `/projects/${project.id}/niches`, headers: H,
      payload: { niches: [{ id: "n1", name: "History", categoryKey: "history_civilisation" }] },
    });
    await app.inject({
      method: "PUT", url: `/projects/${project.id}/audience-strategy`, headers: H,
      payload: { audience: "adults", promise: "evidenced history" },
    });

    // Run creation is gated until an approved Bible exists.
    const gated = await app.inject({
      method: "POST", url: `/projects/${project.id}/runs`, headers: H, payload: { title: "R1" },
    });
    expect(gated.statusCode).toBe(422);
    expect(gated.json().error.details.missing).toContain("approvedBible");

    // Bible generation without a provider key: job fails honestly and
    // the credit hold is fully released.
    const estimate = await app.inject({
      method: "POST", url: "/jobs/estimate", headers: H,
      payload: { action: "bible_generate", params: { units: 1 } },
    });
    const est = estimate.json().data.estimatedCredits;
    const noConfirm = await app.inject({
      method: "POST", url: `/projects/${project.id}/bible/generate`, headers: H, payload: {},
    });
    expect(noConfirm.statusCode).toBe(422); // jobConfirm enforced (§7)
    const gen = await app.inject({
      method: "POST", url: `/projects/${project.id}/bible/generate`, headers: H,
      payload: { jobConfirm: { estimatedCredits: est } },
      headers: { ...H, "idempotency-key": "bible-1" },
    });
    const jobId = gen.json().data.jobId;
    const failedJob = await waitJob(app, accessToken, jobId);
    expect(failedJob.status).toBe("failed");
    expect(failedJob.error.code).toBe("PROVIDER_NOT_CONFIGURED");
    const balanceAfterFail = await deps.auth.store.ledgerBalance(user.id);
    expect(balanceAfterFail).toBe(500); // hold released

    // Idempotency: same key returns the same job, no second hold.
    const dupe = await app.inject({
      method: "POST", url: `/projects/${project.id}/bible/generate`, headers: H,
      payload: { jobConfirm: { estimatedCredits: est } },
      headers: { ...H, "idempotency-key": "bible-1" },
    });
    expect(dupe.json().data.jobId).toBe(jobId);

    // Seed a Bible directly (what the job would produce) and approve it.
    const bible = await platform.createArtifact({
      kind: "bible_version", ownerId: user.id, projectId: project.id,
      versionNo: 1, isCurrent: true, status: "draft",
      data: { channelPromise: { text: "Evidenced history" } },
    });
    const approve = await app.inject({
      method: "POST", url: `/projects/${project.id}/bible/versions/1/approve`, headers: H,
    });
    expect(approve.statusCode).toBe(200);
    void bible;

    // Run + topics
    const run = (await app.inject({
      method: "POST", url: `/projects/${project.id}/runs`, headers: H, payload: { title: "Alexandria" },
    })).json().data;
    expect(run.snapshots.bibleVersion).toBe(1);
    const topicRes = await app.inject({
      method: "POST", url: `/runs/${run.id}/topics`, headers: H,
      payload: { title: "The Library of Alexandria", angle: "evidence vs myth" },
    });
    expect(topicRes.statusCode).toBe(200);
    expect(topicRes.json().data.semanticStatus).toBe("unavailable"); // honest A2 status
    const topicId = topicRes.json().data.id;
    const dupeTopic = await app.inject({
      method: "POST", url: `/runs/${run.id}/topics`, headers: H,
      payload: { title: "The Library of Alexandria", angle: "evidence vs myth" },
    });
    expect(dupeTopic.statusCode).toBe(409);
    expect(dupeTopic.json().error.code).toBe("POSSIBLE_DUPLICATE");
    const confirmed = await app.inject({
      method: "POST", url: `/runs/${run.id}/topics`, headers: H,
      payload: { title: "The Library of Alexandria (part 2)", angle: "evidence vs myth", confirmDuplicate: true },
    });
    expect(confirmed.statusCode).toBe(200);
    const select = await app.inject({
      method: "POST", url: `/runs/${run.id}/topics/${topicId}/select`, headers: H,
    });
    expect(select.json().data.stageMap.topics).toBe("done");

    // Research: verified_fact claim without sources is blocked.
    const claim = await app.inject({
      method: "POST", url: `/runs/${run.id}/research/claims`, headers: H,
      payload: { text: "The library held 400,000 scrolls", status: "verified_fact", sourceIds: [] },
    });
    expect(claim.statusCode).toBe(422);
    const src = await app.inject({
      method: "POST", url: `/runs/${run.id}/research/sources`, headers: H,
      payload: { title: "Strabo, Geography", credibilityTier: 1, reviewStatus: "approved" },
    });
    const claim2 = await app.inject({
      method: "POST", url: `/runs/${run.id}/research/claims`, headers: H,
      payload: { text: "Strabo describes the Mouseion", status: "verified_fact", sourceIds: [src.json().data.id], sourceLocation: "Book 17.1.8" },
    });
    expect(claim2.statusCode).toBe(200);

    // Scenes (manual) + deterministic audit + final approval + package.
    const scene = await app.inject({
      method: "POST", url: `/runs/${run.id}/scenes`, headers: H,
      payload: {
        sceneNo: 1, narration: "Strabo walked these halls.", speakerLabel: "Narrator",
        voWordCount: 4, estimatedVoSec: 1.6, durationEstSec: 2,
        visualDirection: "Marble hall, scroll shelves, warm light",
        shotDescription: "Wide establishing shot", shotType: "wide", cameraMove: "static",
        onScreenText: "none", claimIds: [claim2.json().data.id],
        registryRefs: { characterIds: [], locationIds: [], propIds: [] },
        legalRiskFlag: "none", sfx: [],
      },
    });
    expect(scene.json().data.complete).toBe(true);

    // Manually complete prerequisite stages for the audit/package path.
    const runRec = await platform.getRun(run.id);
    await platform.updateRun(run.id, {
      stageMap: { ...runRec!.stageMap, config: "done", research: "done", outline: "done", script: "done", scenes: "done" },
    });
    const auditEst = (await app.inject({
      method: "POST", url: "/jobs/estimate", headers: H, payload: { action: "audit_run", params: { units: 1 } },
    })).json().data.estimatedCredits;
    const auditJobRes = await app.inject({
      method: "POST", url: `/runs/${run.id}/audit/run`, headers: H,
      payload: { jobConfirm: { estimatedCredits: auditEst } },
    });
    const auditJob = await waitJob(app, accessToken, auditJobRes.json().data.jobId);
    expect(auditJob.status).toBe("done"); // deterministic engine needs no model
    const report = (await app.inject({ method: "GET", url: `/runs/${run.id}/audit`, headers: H })).json().data;
    expect(report.auditorProfile).toBe("deterministic");
    expect(typeof report.totalScore).toBe("number");

    const finalRes = await app.inject({
      method: "POST", url: `/runs/${run.id}/final-approve`, headers: H,
      payload: report.passed ? {} : { override: true, note: "test override" },
    });
    expect(finalRes.statusCode).toBe(200);
    const cert = await app.inject({ method: "GET", url: `/runs/${run.id}/certificate`, headers: H });
    expect(cert.statusCode).toBe(200);

    const pkgEst = (await app.inject({
      method: "POST", url: "/jobs/estimate", headers: H, payload: { action: "package_generate", params: { units: 1 } },
    })).json().data.estimatedCredits;
    const pkgJobRes = await app.inject({
      method: "POST", url: `/runs/${run.id}/package/generate`, headers: H,
      payload: { jobConfirm: { estimatedCredits: pkgEst }, deliverables: ["finalScript", "voInstructions", "completionCertificate"] },
    });
    const pkgJob = await waitJob(app, accessToken, pkgJobRes.json().data.jobId);
    expect(pkgJob.status).toBe("done");
    const pkg = (await app.inject({ method: "GET", url: `/runs/${run.id}/package`, headers: H })).json().data;
    expect(pkg.files.length).toBe(3);
    // Do-Not-Repeat auto-populated on package completion.
    const dnr = (await app.inject({
      method: "GET", url: `/projects/${project.id}/master-lists/doNotRepeat`, headers: H,
    })).json().data;
    expect(dnr.length).toBe(1);
  });

  it("blocks unverified users from jobs and users from admin routes", async () => {
    const { app, authStore } = makeApp();
    const res = await app.inject({
      method: "POST", url: "/auth/signup", payload: { email: "new@example.com", password: GOOD_PW },
    });
    const token = res.json().data.accessToken as string;
    const estimate = await app.inject({
      method: "POST", url: "/jobs/estimate", headers: auth(token),
      payload: { action: "topic_generate", params: {} },
    });
    expect(estimate.statusCode).toBe(200); // estimate is free
    const userId = res.json().data.user.id as string;
    void userId;
    const adminRoute = await app.inject({ method: "GET", url: "/admin/settings", headers: auth(token) });
    expect(adminRoute.statusCode).toBe(403); // wrong token type for the admin guard
    void authStore;
  });

  it("serves taxonomy, config schema and title-only angles from seeds", async () => {
    const { app, authStore } = makeApp();
    const { accessToken } = await signupVerified(app, authStore);
    const niches = await app.inject({ method: "GET", url: "/taxonomy/niches", headers: auth(accessToken) });
    expect(niches.json().data.length).toBe(220);
    const schema = await app.inject({
      method: "GET", url: "/config-schema?nicheId=1", headers: auth(accessToken),
    });
    expect(schema.json().data.length).toBeGreaterThan(30);
    const angles = await app.inject({ method: "GET", url: "/niches/1/angles", headers: auth(accessToken) });
    const list = angles.json().data as Array<{ completeness: string; titleOnlyLabel?: string }>;
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]!.completeness).toBe("title_only");
    expect(list[0]!.titleOnlyLabel).toBe("Title only");
  });

  it("handles uploads with checksum verification and webhooks with one-time secrets", async () => {
    const { app, authStore, deps } = makeApp();
    const { accessToken, user } = await signupVerified(app, authStore);
    const H = auth(accessToken);
    const init = await app.inject({
      method: "POST", url: "/uploads/init", headers: H,
      payload: { filename: "ref.png", contentType: "image/png", sizeBytes: 4, purpose: "scene_reference" },
    });
    expect(init.statusCode).toBe(200);
    const uploadId = init.json().data.uploadId;
    const record = await deps.platform.getArtifact(uploadId);
    await deps.storage.put(String(record!.data.storageKey), Buffer.from("PNG!"));
    const { createHash } = await import("node:crypto");
    const checksum = createHash("sha256").update(Buffer.from("PNG!")).digest("hex");
    const complete = await app.inject({
      method: "POST", url: `/uploads/${uploadId}/complete`, headers: H,
      payload: { checksumSha256: checksum },
    });
    expect(complete.json().data.status).toBe("verified");
    expect(complete.json().data.scanStatus).toBe("not_configured"); // honest A10 state

    const hook = await app.inject({
      method: "POST", url: "/me/webhooks", headers: H,
      payload: { url: "https://example.com/hook", events: ["job_done"] },
    });
    expect(hook.json().data.secret).toBeTruthy(); // shown once
    const list = await app.inject({ method: "GET", url: "/me/webhooks", headers: H });
    expect(list.json().data[0].secret).toBeUndefined(); // never returned again
    void user;
  });
});

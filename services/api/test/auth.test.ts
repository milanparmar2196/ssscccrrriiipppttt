import Fastify from "fastify";
import { beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { FailingEmailProvider, LogEmailProvider } from "../src/auth/email.js";
import { requireAdmin } from "../src/auth/guards.js";
import { MemoryAuthStore } from "../src/auth/memory-store.js";
import { hashPassword } from "../src/auth/passwords.js";
import { assertVerifiedForJobs, runDeletionJob, type AuthDeps } from "../src/auth/service.js";
import { successBody } from "../src/errors.js";

process.env.AUTH_JWT_SECRET = "test-secret";
process.env.ADMIN_BOOTSTRAP_EMAIL = "root@example.com";
process.env.ADMIN_BOOTSTRAP_PASSWORD = "bootstrap-pass";

const GOOD_PW = "Str0ng!Passw0rd";
const clearFetcher = async () => "ABCDEF0123456789:100\n"; // no suffix matches

function makeApp(email = new LogEmailProvider()) {
  const store = new MemoryAuthStore();
  const deps: AuthDeps = { store, email, breachFetcher: clearFetcher };
  const app = buildApp({ authDeps: deps });
  return { app, store, deps };
}

function outboxToken(store: MemoryAuthStore, template: string): string {
  const rec = [...store.outbox].reverse().find((o) => o.template === template);
  if (!rec) throw new Error(`no outbox email for ${template}`);
  return String((rec.payload as { token: string }).token);
}

async function signupOk(app: ReturnType<typeof buildApp>, email = "user@example.com") {
  const res = await app.inject({
    method: "POST",
    url: "/auth/signup",
    payload: { email, password: GOOD_PW },
  });
  expect(res.statusCode).toBe(200);
  return res.json().data as { accessToken: string; refreshToken: string; user: { id: string } };
}

describe("signup + password policy (D2)", () => {
  it("rejects short and very weak passwords with 422", async () => {
    const { app } = makeApp();
    const short = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "a@example.com", password: "Ab1!x" },
    });
    expect(short.statusCode).toBe(422);
    const weak = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "a@example.com", password: "passwordpassword" },
    });
    expect(weak.statusCode).toBe(422);
  });

  it("rejects a breached password; accepts with notice when the check is unavailable", async () => {
    const sha1 = (await import("node:crypto")).createHash("sha1").update(GOOD_PW).digest("hex").toUpperCase();
    const breachedFetcher = async () => `${sha1.slice(5)}:500\n`;
    const store1 = new MemoryAuthStore();
    const app1 = buildApp({
      authDeps: { store: store1, email: new LogEmailProvider(), breachFetcher: breachedFetcher },
    });
    const hit = await app1.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "b@example.com", password: GOOD_PW },
    });
    expect(hit.statusCode).toBe(422);

    const down = async () => {
      throw new Error("offline");
    };
    const store2 = new MemoryAuthStore();
    const app2 = buildApp({
      authDeps: { store: store2, email: new LogEmailProvider(), breachFetcher: down },
    });
    const okRes = await app2.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "b@example.com", password: GOOD_PW },
    });
    expect(okRes.statusCode).toBe(200);
    expect(okRes.json().data.breachCheck).toBe("unavailable");
  });

  it("email failure leaves signup working with a queued status and a valid token", async () => {
    const { app, store } = makeApp(new FailingEmailProvider());
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { email: "c@example.com", password: GOOD_PW },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.emailStatus).toBe("queued");
    const token = outboxToken(store, "verify_email");
    const verify = await app.inject({ method: "GET", url: `/auth/verify-email/${token}` });
    expect(verify.json().data.state).toBe("verified");
  });
});

describe("verification gate (A10)", () => {
  it("blocks jobs before verification, allows after; token reuse reports already_used", async () => {
    const { app, store, deps } = makeApp();
    const { user } = await signupOk(app);
    const record = await store.getUserById(user.id);
    expect(() => assertVerifiedForJobs(record!)).toThrowError(/EMAIL_NOT_VERIFIED|Verify your email/);
    const token = outboxToken(store, "verify_email");
    const v1 = await app.inject({ method: "GET", url: `/auth/verify-email/${token}` });
    expect(v1.json().data.state).toBe("verified");
    const after = await store.getUserById(user.id);
    expect(() => assertVerifiedForJobs(after!)).not.toThrow();
    const v2 = await app.inject({ method: "GET", url: `/auth/verify-email/${token}` });
    expect(v2.json().data.state).toBe("already_used");
    void deps;
  });

  it("resend enforces the 60s cooldown", async () => {
    const { app } = makeApp();
    const { accessToken } = await signupOk(app);
    const res = await app.inject({
      method: "POST",
      url: "/auth/resend-verification",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(429);
    expect(res.headers["retry-after"]).toBeDefined();
  });
});

describe("sessions: rotation + reuse revocation (C-block)", () => {
  it("rotates refresh tokens and revokes the family on reuse", async () => {
    const { app } = makeApp();
    const first = await signupOk(app);
    const rotated = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: first.refreshToken },
    });
    expect(rotated.statusCode).toBe(200);
    const second = rotated.json().data as { refreshToken: string };
    const reuse = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: first.refreshToken },
    });
    expect(reuse.statusCode).toBe(401);
    const afterRevoke = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: second.refreshToken },
    });
    expect(afterRevoke.statusCode).toBe(401);
  });

  it("reset password revokes all other sessions", async () => {
    const { app, store } = makeApp();
    const { accessToken } = await signupOk(app);
    await app.inject({ method: "POST", url: "/auth/forgot-password", payload: { email: "user@example.com" } });
    const token = outboxToken(store, "password_reset");
    const reset = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: { token, newPassword: "An0ther!Strong1" },
    });
    expect(reset.statusCode).toBe(200);
    const me = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(401);
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com", password: "An0ther!Strong1" },
    });
    expect(login.statusCode).toBe(200);
  });
});

describe("login lockout + suspended (A9/D3)", () => {
  it("locks out after 5 failed attempts", async () => {
    const { app } = makeApp();
    await signupOk(app);
    for (let i = 0; i < 5; i++) {
      const bad = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "user@example.com", password: "WrongPass123!" },
      });
      expect(bad.statusCode).toBe(401);
    }
    const locked = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com", password: GOOD_PW },
    });
    expect(locked.statusCode).toBe(429);
  });

  it("suspended accounts get ACCOUNT_SUSPENDED", async () => {
    const { app, store } = makeApp();
    const { user } = await signupOk(app);
    await store.updateUser(user.id, { status: "suspended" });
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com", password: GOOD_PW },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("account deletion lifecycle (§3)", () => {
  it("schedules, blocks the API, and cancels by login", async () => {
    const { app, deps } = makeApp();
    const { accessToken } = await signupOk(app);
    const wrong = await app.inject({
      method: "DELETE",
      url: "/me",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { password: "WrongPass123!" },
    });
    expect(wrong.statusCode).toBe(403);
    const del = await app.inject({
      method: "DELETE",
      url: "/me",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { password: GOOD_PW },
    });
    expect(del.statusCode).toBe(200);
    const me = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(401); // sessions revoked immediately
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com", password: GOOD_PW },
    });
    expect(login.json().data.accountStatus).toBe("pending_deletion");
    const cancel = await app.inject({
      method: "POST",
      url: "/auth/cancel-deletion",
      payload: { email: "user@example.com", password: GOOD_PW },
    });
    expect(cancel.statusCode).toBe(200);
    const record = await deps.store.getUserByEmail("user@example.com");
    expect(record!.status).toBe("active");
    // deletion job: not due while active / inside grace
    expect(await runDeletionJob(deps, record!)).toBe("not_due");
  });
});

describe("admin auth (A9)", () => {
  it("bootstrap logs in while no AdminUser exists; AdminUser login works after", async () => {
    const { app, store } = makeApp();
    const boot = await app.inject({
      method: "POST",
      url: "/admin/auth/login",
      payload: { email: "root@example.com", password: "bootstrap-pass" },
    });
    expect(boot.statusCode).toBe(200);
    expect(boot.json().data.actor).toBe("bootstrap");
    await store.createAdminUser({
      email: "admin@example.com",
      passwordHash: hashPassword("Admin!Strong99"),
      role: "admin",
      status: "active",
      mfaEnabled: false,
    });
    const admin = await app.inject({
      method: "POST",
      url: "/admin/auth/login",
      payload: { email: "admin@example.com", password: "Admin!Strong99" },
    });
    expect(admin.statusCode).toBe(200);
    expect(admin.json().data.role).toBe("admin");
    // admin token passes the admin guard; a user token does not
    const probe = Fastify();
    probe.get("/probe", async (req) => {
      await requireAdmin(store, req);
      return successBody({ ok: true });
    });
    const okRes = await probe.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: `Bearer ${admin.json().data.accessToken}` },
    });
    expect(okRes.statusCode).toBe(200);
    const { accessToken } = await signupOk(app, "plain@example.com");
    const badRes = await probe.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(badRes.statusCode).toBe(403);
  });
});

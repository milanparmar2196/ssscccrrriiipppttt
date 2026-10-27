import type { FastifyInstance } from "fastify";
import { ApiError, successBody } from "../errors.js";
import { requireUser } from "./guards.js";
import {
  adminLogin,
  cancelDeletion,
  deleteMe,
  forgotPassword,
  login,
  logout,
  publicUser,
  refresh,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
  type AuthDeps,
} from "./service.js";

interface CredentialsBody {
  email?: string;
  password?: string;
  displayName?: string;
  refreshToken?: string;
  token?: string;
  newPassword?: string;
}

function requireFields(body: CredentialsBody, fields: string[]): void {
  const missing = fields.filter((f) => {
    const v = (body as Record<string, unknown>)[f];
    return typeof v !== "string" || v.length === 0;
  });
  if (missing.length > 0) {
    throw new ApiError("VALIDATION", "Missing or invalid fields", {
      fields: Object.fromEntries(missing.map((f) => [f, "required"])),
    });
  }
}

export function registerAuthRoutes(app: FastifyInstance, deps: AuthDeps): void {
  app.post<{ Body: CredentialsBody }>("/auth/signup", async (req) => {
    requireFields(req.body ?? {}, ["email", "password"]);
    const result = await signup(deps, {
      email: req.body.email!,
      password: req.body.password!,
      displayName: req.body.displayName,
    });
    return successBody({
      user: publicUser(result.user),
      ...result.tokens,
      emailStatus: result.emailStatus,
      breachCheck: result.breachCheck,
    });
  });

  app.post<{ Body: CredentialsBody }>("/auth/login", async (req) => {
    requireFields(req.body ?? {}, ["email", "password"]);
    const result = await login(deps, { email: req.body.email!, password: req.body.password! });
    if (result.kind === "pending_deletion") {
      return successBody({
        accountStatus: "pending_deletion",
        canCancelDeletion: true,
        user: publicUser(result.user),
      });
    }
    return successBody({ user: publicUser(result.user), ...result.tokens });
  });

  app.post<{ Body: CredentialsBody }>("/auth/cancel-deletion", async (req) => {
    requireFields(req.body ?? {}, ["email", "password"]);
    const result = await cancelDeletion(deps, {
      email: req.body.email!,
      password: req.body.password!,
    });
    return successBody({ user: publicUser(result.user), ...result.tokens });
  });

  app.post<{ Body: CredentialsBody }>("/auth/refresh", async (req) => {
    requireFields(req.body ?? {}, ["refreshToken"]);
    const pair = await refresh(deps, req.body.refreshToken!);
    return successBody(pair);
  });

  app.post("/auth/logout", async (req) => {
    await requireUser(deps.store, req);
    await logout(deps, req.auth!.sessionId);
    return successBody({ loggedOut: true });
  });

  app.post<{ Body: CredentialsBody }>("/auth/forgot-password", async (req) => {
    requireFields(req.body ?? {}, ["email"]);
    const result = await forgotPassword(deps, req.body.email!);
    return successBody({ accepted: true, emailStatus: result.emailStatus });
  });

  app.post<{ Body: CredentialsBody }>("/auth/reset-password", async (req) => {
    requireFields(req.body ?? {}, ["token", "newPassword"]);
    const result = await resetPassword(deps, req.body.token!, req.body.newPassword!);
    return successBody({ reset: true, breachCheck: result.breachCheck });
  });

  app.get<{ Params: { token: string } }>("/auth/verify-email/:token", async (req) => {
    const state = await verifyEmail(deps, req.params.token);
    return successBody({ state });
  });

  app.post("/auth/resend-verification", async (req) => {
    // Always 200 (no account enumeration): resolves the caller when a
    // valid user token is present, silently succeeds otherwise (§3).
    const user = await requireUser(deps.store, req).catch(() => undefined);
    if (user) {
      const result = await resendVerification(deps, user);
      return successBody({ accepted: true, emailStatus: result.emailStatus });
    }
    return successBody({ accepted: true });
  });

  app.get("/me", async (req) => {
    const user = await requireUser(deps.store, req);
    return successBody(publicUser(user));
  });

  app.patch<{ Body: Record<string, unknown> }>("/me", async (req) => {
    const user = await requireUser(deps.store, req);
    const patch: Record<string, unknown> = {};
    if (typeof req.body?.displayName === "string") patch.displayName = req.body.displayName;
    if (typeof req.body?.defaultLanguage === "string") {
      patch.defaultLanguage = req.body.defaultLanguage;
    }
    if (req.body?.notificationPrefs && typeof req.body.notificationPrefs === "object") {
      patch.notificationPrefs = {
        ...user.notificationPrefs,
        ...(req.body.notificationPrefs as Record<string, unknown>),
      };
    }
    const updated = await deps.store.updateUser(user.id, patch);
    return successBody(publicUser(updated));
  });

  app.get("/me/credits", async (req) => {
    const user = await requireUser(deps.store, req);
    const balance = await deps.store.ledgerBalance(user.id);
    return successBody({ balance, planKey: user.planKey });
  });

  app.get<{ Querystring: { limit?: string; offset?: string } }>("/me/credits/ledger", async (req) => {
    const user = await requireUser(deps.store, req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const entries = await deps.store.listLedger(user.id, limit + 1, offset);
    return successBody(entries.slice(0, limit), {
      hasMore: entries.length > limit,
    });
  });

  app.delete<{ Body: CredentialsBody }>("/me", async (req) => {
    const user = await requireUser(deps.store, req);
    requireFields(req.body ?? {}, ["password"]);
    await deleteMe(deps, user, req.body.password!);
    return successBody({ deletionScheduled: true, graceDays: 30 });
  });

  /* ---- Admin auth (A9) ---- */
  app.post<{ Body: CredentialsBody }>("/admin/auth/login", async (req) => {
    requireFields(req.body ?? {}, ["email", "password"]);
    const result = await adminLogin(deps, {
      email: req.body.email!,
      password: req.body.password!,
    });
    return successBody({ ...result.tokens, actor: result.actor, role: result.role });
  });
}

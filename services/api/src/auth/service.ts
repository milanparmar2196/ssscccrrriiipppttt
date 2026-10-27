/**
 * Auth service — the business logic of API §3 (+ A9 admin auth, A10
 * email gating). Routes are thin wrappers over these functions.
 */
import { ApiError } from "../errors.js";
import { sendEmail, type EmailProvider, type EmailStatus } from "./email.js";
import {
  hashPassword,
  validateNewPassword,
  verifyPassword,
  type BreachFetcher,
} from "./passwords.js";
import { AUTH_SETTINGS } from "./settings.js";
import type { AuthStore, UserRecord } from "./store.js";
import {
  daysFromNow,
  hashToken,
  hoursFromNow,
  minutesFromNow,
  newId,
  newRefreshToken,
  signAccessToken,
} from "./tokens.js";

export interface AuthDeps {
  store: AuthStore;
  email: EmailProvider;
  breachFetcher?: BreachFetcher;
  appBaseUrl?: string; // for email links
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const iso = (d: Date) => d.toISOString();
const minsAgo = (min: number) => iso(new Date(Date.now() - min * 60_000));

/** Public user shape — the password hash is never returned (§3). */
export function publicUser(u: UserRecord) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    defaultLanguage: u.defaultLanguage,
    notificationPrefs: u.notificationPrefs,
    planKey: u.planKey,
    emailVerified: !!u.emailVerifiedAt,
    status: u.status,
    createdAt: u.createdAt,
  };
}

async function createSessionPair(
  deps: AuthDeps,
  userId: string,
  kind: "user" | "admin",
  opts?: { role?: string; actor?: string; familyId?: string },
): Promise<TokenPair> {
  const refresh = newRefreshToken();
  const session = await deps.store.createSession({
    userId,
    kind,
    familyId: opts?.familyId ?? newId(),
    refreshTokenHash: refresh.hash,
    expiresAt: daysFromNow(AUTH_SETTINGS.refreshTokenTtlDays),
    actorLabel: opts?.actor,
  });
  const accessToken = await signAccessToken(
    { sub: userId, typ: kind, sid: session.id, role: opts?.role, actor: opts?.actor },
    kind,
  );
  return { accessToken, refreshToken: refresh.token };
}

/** Login lockout: too many failures inside the window -> locked (A9). */
export async function assertLoginAllowed(deps: AuthDeps, scopeKey: string): Promise<void> {
  const since = minsAgo(AUTH_SETTINGS.loginWindowMin);
  const failures = await deps.store.countFailedLogins(scopeKey, since);
  if (failures >= AUTH_SETTINGS.loginMaxFailures) {
    const latest = await deps.store.latestFailedLoginAt(scopeKey, since);
    const unlockAt = latest
      ? new Date(new Date(latest).getTime() + AUTH_SETTINGS.loginLockoutMin * 60_000)
      : new Date(Date.now() + AUTH_SETTINGS.loginLockoutMin * 60_000);
    const retryAfterSec = Math.max(1, Math.ceil((unlockAt.getTime() - Date.now()) / 1000));
    throw new ApiError("RATE_LIMITED", "Too many failed login attempts — try again later", {
      retryAfterSec,
    });
  }
}

async function issueEmailToken(
  deps: AuthDeps,
  user: UserRecord,
  purpose: "verify_email" | "reset_password",
): Promise<string> {
  await deps.store.invalidateEmailTokens(user.id, purpose);
  const raw = newRefreshToken().token; // opaque single-use token
  const ttlH =
    purpose === "verify_email"
      ? AUTH_SETTINGS.verifyTokenTtlHours
      : AUTH_SETTINGS.resetTokenTtlHours;
  await deps.store.createEmailToken({
    userId: user.id,
    purpose,
    tokenHash: hashToken(raw),
    expiresAt: hoursFromNow(ttlH),
  });
  return raw;
}

export async function signup(
  deps: AuthDeps,
  input: { email: string; password: string; displayName?: string },
): Promise<{ user: UserRecord; tokens: TokenPair; emailStatus: EmailStatus; breachCheck: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await deps.store.getUserByEmail(email);
  if (existing && existing.status !== "deleted") {
    throw new ApiError("VALIDATION", "An account with this email already exists", {
      fields: { email: "already registered" },
    });
  }
  const policy = await validateNewPassword(input.password, deps.breachFetcher);
  if (!policy.ok) {
    throw new ApiError("VALIDATION", "Password does not meet the requirements", {
      fields: { password: policy.errors.join("; ") },
      breachCheck: policy.breachCheck,
    });
  }
  const user = await deps.store.createUser({
    email,
    passwordHash: hashPassword(input.password),
    displayName: input.displayName,
    notificationPrefs: {},
    planKey: "personal",
    emailVerifiedAt: null,
    status: "active",
    deletionRequestedAt: null,
  });
  const token = await issueEmailToken(deps, user, "verify_email");
  const emailStatus = await sendEmail(deps.store, deps.email, {
    to: email,
    template: "verify_email",
    payload: { token, expiresHours: AUTH_SETTINGS.verifyTokenTtlHours },
  });
  await deps.store.recordEvent(user.id, "verification_sent");
  const tokens = await createSessionPair(deps, user.id, "user");
  return { user, tokens, emailStatus, breachCheck: policy.breachCheck };
}

export type LoginResult =
  | { kind: "ok"; user: UserRecord; tokens: TokenPair }
  | { kind: "pending_deletion"; user: UserRecord };

export async function login(
  deps: AuthDeps,
  input: { email: string; password: string },
): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const scopeKey = `user:${email}`;
  await assertLoginAllowed(deps, scopeKey);
  const user = await deps.store.getUserByEmail(email);
  const ok = user && user.status !== "deleted" && verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    await deps.store.recordLoginAttempt(scopeKey, false);
    throw new ApiError("UNAUTHORIZED", "Invalid email or password");
  }
  await deps.store.recordLoginAttempt(scopeKey, true);
  if (user.status === "suspended") {
    throw new ApiError("ACCOUNT_SUSPENDED", "This account is suspended");
  }
  if (user.status === "pending_deletion" || user.status === "deletion_failed") {
    return { kind: "pending_deletion", user }; // cancel-by-login prompt (§3)
  }
  const tokens = await createSessionPair(deps, user.id, "user");
  return { kind: "ok", user, tokens };
}

/** Cancel a scheduled deletion by re-authenticating during grace (§3). */
export async function cancelDeletion(
  deps: AuthDeps,
  input: { email: string; password: string },
): Promise<{ user: UserRecord; tokens: TokenPair }> {
  const email = input.email.trim().toLowerCase();
  const user = await deps.store.getUserByEmail(email);
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new ApiError("UNAUTHORIZED", "Invalid email or password");
  }
  if (user.status !== "pending_deletion" && user.status !== "deletion_failed") {
    throw new ApiError("VALIDATION", "This account is not scheduled for deletion");
  }
  const restored = await deps.store.updateUser(user.id, {
    status: "active",
    deletionRequestedAt: null,
  });
  await sendEmail(deps.store, deps.email, {
    to: email,
    template: "deletion_cancelled",
    payload: {},
  });
  const tokens = await createSessionPair(deps, user.id, "user");
  return { user: restored, tokens };
}

/** Refresh with rotation; reuse of a rotated-out token revokes the family. */
export async function refresh(deps: AuthDeps, refreshToken: string): Promise<TokenPair> {
  const session = await deps.store.getSessionByRefreshHash(hashToken(refreshToken));
  if (!session) throw new ApiError("UNAUTHORIZED", "Invalid refresh token");
  if (session.revokedAt) {
    if (session.replacedById) {
      // A rotated-out token was presented again -> treat as theft.
      await deps.store.revokeFamily(session.familyId);
      throw new ApiError("UNAUTHORIZED", "Refresh token reuse detected — session family revoked");
    }
    throw new ApiError("UNAUTHORIZED", "Session revoked");
  }
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    throw new ApiError("UNAUTHORIZED", "Refresh token expired");
  }
  const pair = await createSessionPair(deps, session.userId, session.kind, {
    familyId: session.familyId,
    actor: session.actorLabel,
  });
  // Link the old session to its replacement (needs the new session id).
  const newSession = await deps.store.getSessionByRefreshHash(hashToken(pair.refreshToken));
  await deps.store.updateSession(session.id, {
    revokedAt: new Date().toISOString(),
    replacedById: newSession?.id,
  });
  return pair;
}

export async function logout(deps: AuthDeps, sessionId: string): Promise<void> {
  await deps.store.updateSession(sessionId, { revokedAt: new Date().toISOString() });
}

/** Always succeeds outwardly (no account enumeration, §3). */
export async function forgotPassword(
  deps: AuthDeps,
  emailRaw: string,
): Promise<{ emailStatus: EmailStatus }> {
  const email = emailRaw.trim().toLowerCase();
  const user = await deps.store.getUserByEmail(email);
  if (!user || user.status === "deleted" || user.status === "suspended") {
    return { emailStatus: "queued" };
  }
  const token = await issueEmailToken(deps, user, "reset_password");
  const emailStatus = await sendEmail(deps.store, deps.email, {
    to: email,
    template: "password_reset",
    payload: { token, expiresHours: AUTH_SETTINGS.resetTokenTtlHours },
  });
  return { emailStatus };
}

export async function resetPassword(
  deps: AuthDeps,
  token: string,
  newPassword: string,
): Promise<{ breachCheck: string }> {
  const rec = await deps.store.getEmailTokenByHash(hashToken(token));
  if (!rec || rec.purpose !== "reset_password" || rec.invalidatedAt) {
    throw new ApiError("VALIDATION", "This reset link is invalid", { state: "invalid" });
  }
  if (rec.usedAt) {
    throw new ApiError("VALIDATION", "This reset link has already been used", { state: "already_used" });
  }
  if (new Date(rec.expiresAt).getTime() < Date.now()) {
    throw new ApiError("VALIDATION", "This reset link has expired", { state: "expired" });
  }
  const policy = await validateNewPassword(newPassword, deps.breachFetcher);
  if (!policy.ok) {
    throw new ApiError("VALIDATION", "Password does not meet the requirements", {
      fields: { password: policy.errors.join("; ") },
      breachCheck: policy.breachCheck,
    });
  }
  await deps.store.updateEmailToken(rec.id, { usedAt: new Date().toISOString() });
  await deps.store.updateUser(rec.userId, { passwordHash: hashPassword(newPassword) });
  // §3: a successful reset revokes all other sessions.
  await deps.store.revokeAllUserSessions(rec.userId, "user");
  return { breachCheck: policy.breachCheck };
}

export type VerifyResult = "verified" | "expired" | "already_used" | "invalid";

export async function verifyEmail(deps: AuthDeps, token: string): Promise<VerifyResult> {
  const rec = await deps.store.getEmailTokenByHash(hashToken(token));
  if (!rec || rec.purpose !== "verify_email" || rec.invalidatedAt) return "invalid";
  if (rec.usedAt) return "already_used";
  if (new Date(rec.expiresAt).getTime() < Date.now()) {
    await deps.store.recordEvent(rec.userId, "verification_expired_attempt");
    return "expired";
  }
  await deps.store.updateEmailToken(rec.id, { usedAt: new Date().toISOString() });
  await deps.store.updateUser(rec.userId, { emailVerifiedAt: new Date().toISOString() });
  await deps.store.recordEvent(rec.userId, "verified");
  return "verified";
}

/** Resend with 60s cooldown + 5/day cap (§3). Caller must be the account owner. */
export async function resendVerification(
  deps: AuthDeps,
  user: UserRecord,
): Promise<{ emailStatus: EmailStatus }> {
  if (user.emailVerifiedAt) return { emailStatus: "sent" };
  const latest = await deps.store.latestEmailTokenAt(user.id, "verify_email");
  if (latest) {
    const ageSec = (Date.now() - new Date(latest).getTime()) / 1000;
    if (ageSec < AUTH_SETTINGS.resendCooldownSec) {
      throw new ApiError("RATE_LIMITED", "Please wait before requesting another verification email", {
        retryAfterSec: Math.ceil(AUTH_SETTINGS.resendCooldownSec - ageSec),
      });
    }
  }
  const dayAgo = iso(new Date(Date.now() - 24 * 3600_000));
  const sentToday = await deps.store.countRecentEmailTokens(user.id, "verify_email", dayAgo);
  if (sentToday >= AUTH_SETTINGS.resendDailyMax) {
    throw new ApiError("RATE_LIMITED", "Daily verification email limit reached", {
      retryAfterSec: 3600,
    });
  }
  const token = await issueEmailToken(deps, user, "verify_email");
  const emailStatus = await sendEmail(deps.store, deps.email, {
    to: user.email,
    template: "verify_email",
    payload: { token, expiresHours: AUTH_SETTINGS.verifyTokenTtlHours },
  });
  await deps.store.recordEvent(user.id, "verification_resent");
  return { emailStatus };
}

/** The A10 gate: cost-incurring actions require a verified email. */
export function assertVerifiedForJobs(user: UserRecord): void {
  if (!user.emailVerifiedAt) {
    throw new ApiError(
      "EMAIL_NOT_VERIFIED",
      "Verify your email address before starting this job",
      { resendAvailable: true },
    );
  }
  if (user.status === "suspended") throw new ApiError("ACCOUNT_SUSPENDED", "This account is suspended");
  if (user.status !== "active") {
    throw new ApiError("FORBIDDEN", "This account cannot start jobs");
  }
}

export async function deleteMe(deps: AuthDeps, user: UserRecord, password: string): Promise<void> {
  if (!verifyPassword(password, user.passwordHash)) {
    throw new ApiError("FORBIDDEN", "Password confirmation failed");
  }
  await deps.store.updateUser(user.id, {
    status: "pending_deletion",
    deletionRequestedAt: new Date().toISOString(),
  });
  // Immediate revocation: the deletion request is the last authenticated action.
  await deps.store.revokeAllUserSessions(user.id, "user");
  await deps.store.invalidateEmailTokens(user.id, "verify_email");
  await deps.store.invalidateEmailTokens(user.id, "reset_password");
  await deps.store.recordEvent(user.id, "deletion_scheduled");
  await sendEmail(deps.store, deps.email, {
    to: user.email,
    template: "deletion_scheduled",
    payload: { graceDays: AUTH_SETTINGS.deletionGraceDays },
  });
}

/**
 * Hard-delete pass for accounts past the grace period (§3). Idempotent;
 * a failure leaves the account whole in deletion_failed (admin-visible,
 * user notified) — never silently half-deleted. Feature slices register
 * extra deleters (projects, uploads, YouTube tokens...) via `extra`.
 */
export async function runDeletionJob(
  deps: AuthDeps,
  user: UserRecord,
  extra: Array<(userId: string) => Promise<void>> = [],
): Promise<"deleted" | "not_due" | "failed"> {
  if (user.status !== "pending_deletion" || !user.deletionRequestedAt) return "not_due";
  const dueAt = new Date(user.deletionRequestedAt).getTime() + AUTH_SETTINGS.deletionGraceDays * 86400_000;
  if (Date.now() < dueAt) return "not_due";
  try {
    for (const fn of extra) await fn(user.id);
    await deps.store.revokeAllUserSessions(user.id, "user");
    await deps.store.anonymiseUser(user.id); // ledger/audit rows keep amounts, userId -> deleted-user
    return "deleted";
  } catch {
    await deps.store.updateUser(user.id, { status: "deletion_failed" });
    return "failed";
  }
}

/* ---------------- Admin auth (A9) ---------------- */

export interface AdminLoginResult {
  tokens: TokenPair;
  actor: string; // admin user id | "bootstrap"
  role: "admin" | "super_admin";
}

export async function adminLogin(
  deps: AuthDeps,
  input: { email: string; password: string },
): Promise<AdminLoginResult> {
  const email = input.email.trim().toLowerCase();
  const scopeKey = `admin:${email}`;
  await assertLoginAllowed(deps, scopeKey);

  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase();
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const adminCount = await deps.store.countAdminUsers();
  const anyActiveAdmin = adminCount > 0; // refined below by lookup when possible

  if (
    bootstrapEmail &&
    bootstrapPassword &&
    email === bootstrapEmail &&
    input.password === bootstrapPassword &&
    (!anyActiveAdmin || (await deps.store.getAdminByEmail(email))?.status !== "active")
  ) {
    await deps.store.recordLoginAttempt(scopeKey, true);
    // Bootstrap identity is not a DB user; sessions key on the reserved id.
    const tokens = await createSessionPair(deps, "bootstrap", "admin", {
      role: "super_admin",
      actor: "bootstrap",
    });
    return { tokens, actor: "bootstrap", role: "super_admin" };
  }

  const admin = await deps.store.getAdminByEmail(email);
  const ok =
    admin && admin.status === "active" && verifyPassword(input.password, admin.passwordHash);
  if (!ok) {
    await deps.store.recordLoginAttempt(scopeKey, false);
    throw new ApiError("UNAUTHORIZED", "Invalid admin credentials");
  }
  await deps.store.recordLoginAttempt(scopeKey, true);
  const tokens = await createSessionPair(deps, admin.id, "admin", { role: admin.role });
  return { tokens, actor: admin.id, role: admin.role };
}

export { minutesFromNow };

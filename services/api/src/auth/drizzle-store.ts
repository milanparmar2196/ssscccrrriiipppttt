import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import {
  accountEvents,
  adminUsers,
  creditLedger,
  emailOutbox,
  emailTokens,
  loginAttempts,
  sessions,
  users,
} from "../db/auth-schema.js";
import type {
  AdminUserRecord,
  AuthStore,
  EmailTokenRecord,
  LedgerRecord,
  OutboxRecord,
  SessionRecord,
  UserRecord,
} from "./store.js";

const iso = (d: Date | null | undefined): string | null =>
  d ? d.toISOString() : null;

function toUser(r: typeof users.$inferSelect): UserRecord {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.passwordHash,
    displayName: r.displayName ?? undefined,
    defaultLanguage: r.defaultLanguage ?? undefined,
    notificationPrefs: (r.notificationPrefs ?? {}) as Record<string, unknown>,
    planKey: r.planKey,
    emailVerifiedAt: iso(r.emailVerifiedAt),
    status: r.status as UserRecord["status"],
    deletionRequestedAt: iso(r.deletionRequestedAt),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toSession(r: typeof sessions.$inferSelect): SessionRecord {
  return {
    id: r.id,
    userId: r.userId,
    kind: r.kind as "user" | "admin",
    familyId: r.familyId,
    refreshTokenHash: r.refreshTokenHash,
    expiresAt: r.expiresAt.toISOString(),
    revokedAt: iso(r.revokedAt),
    replacedById: r.replacedById ?? null,
    actorLabel: r.actorLabel ?? undefined,
  };
}

export class DrizzleAuthStore implements AuthStore {
  async createUser(u: Omit<UserRecord, "id" | "createdAt" | "updatedAt">) {
    const rows = await getDb()
      .insert(users)
      .values({
        email: u.email,
        passwordHash: u.passwordHash,
        displayName: u.displayName,
        defaultLanguage: u.defaultLanguage,
        notificationPrefs: u.notificationPrefs,
        planKey: u.planKey,
        emailVerifiedAt: u.emailVerifiedAt ? new Date(u.emailVerifiedAt) : null,
        status: u.status,
        deletionRequestedAt: u.deletionRequestedAt ? new Date(u.deletionRequestedAt) : null,
      })
      .returning();
    return toUser(rows[0]!);
  }
  async getUserByEmail(email: string) {
    const rows = await getDb().select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return rows[0] ? toUser(rows[0]) : undefined;
  }
  async getUserById(id: string) {
    const rows = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? toUser(rows[0]) : undefined;
  }
  async updateUser(id: string, patch: Partial<UserRecord>) {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.email !== undefined) set.email = patch.email;
    if (patch.passwordHash !== undefined) set.passwordHash = patch.passwordHash;
    if (patch.displayName !== undefined) set.displayName = patch.displayName;
    if (patch.defaultLanguage !== undefined) set.defaultLanguage = patch.defaultLanguage;
    if (patch.notificationPrefs !== undefined) set.notificationPrefs = patch.notificationPrefs;
    if (patch.planKey !== undefined) set.planKey = patch.planKey;
    if (patch.emailVerifiedAt !== undefined) {
      set.emailVerifiedAt = patch.emailVerifiedAt ? new Date(patch.emailVerifiedAt) : null;
    }
    if (patch.status !== undefined) set.status = patch.status;
    if (patch.deletionRequestedAt !== undefined) {
      set.deletionRequestedAt = patch.deletionRequestedAt ? new Date(patch.deletionRequestedAt) : null;
    }
    const rows = await getDb().update(users).set(set).where(eq(users.id, id)).returning();
    return toUser(rows[0]!);
  }
  async anonymiseUser(id: string) {
    const db = getDb();
    await db
      .update(users)
      .set({
        email: `deleted-${id}@deleted.invalid`,
        displayName: null,
        passwordHash: "anonymised",
        status: "deleted",
      })
      .where(eq(users.id, id));
    await db
      .update(creditLedger)
      .set({ userId: "deleted-user" })
      .where(eq(creditLedger.userId, id));
  }

  async listUsers(limit: number) {
    const rows = await getDb().select().from(users).limit(limit);
    return rows.map(toUser);
  }
  async createSession(s: Omit<SessionRecord, "id">) {
    const rows = await getDb()
      .insert(sessions)
      .values({
        userId: s.userId,
        kind: s.kind,
        familyId: s.familyId,
        refreshTokenHash: s.refreshTokenHash,
        expiresAt: new Date(s.expiresAt),
        actorLabel: s.actorLabel,
      })
      .returning();
    return toSession(rows[0]!);
  }
  async getSessionByRefreshHash(hash: string) {
    const rows = await getDb()
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, hash))
      .limit(1);
    return rows[0] ? toSession(rows[0]) : undefined;
  }
  async getSessionById(id: string) {
    const rows = await getDb().select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return rows[0] ? toSession(rows[0]) : undefined;
  }
  async updateSession(id: string, patch: Partial<SessionRecord>) {
    const set: Record<string, unknown> = {};
    if (patch.revokedAt !== undefined) set.revokedAt = patch.revokedAt ? new Date(patch.revokedAt) : null;
    if (patch.replacedById !== undefined) set.replacedById = patch.replacedById;
    if (Object.keys(set).length) {
      await getDb().update(sessions).set(set).where(eq(sessions.id, id));
    }
  }
  async revokeFamily(familyId: string) {
    await getDb()
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.familyId, familyId), sql`${sessions.revokedAt} IS NULL`));
  }
  async revokeAllUserSessions(userId: string, kind: "user" | "admin") {
    await getDb()
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.kind, kind),
          sql`${sessions.revokedAt} IS NULL`,
        ),
      );
  }

  async createEmailToken(t: Omit<EmailTokenRecord, "id" | "createdAt">) {
    const rows = await getDb()
      .insert(emailTokens)
      .values({
        userId: t.userId,
        purpose: t.purpose,
        tokenHash: t.tokenHash,
        expiresAt: new Date(t.expiresAt),
      })
      .returning();
    const r = rows[0]!;
    return {
      id: r.id,
      userId: r.userId,
      purpose: r.purpose as EmailTokenRecord["purpose"],
      tokenHash: r.tokenHash,
      expiresAt: r.expiresAt.toISOString(),
      usedAt: iso(r.usedAt),
      invalidatedAt: iso(r.invalidatedAt),
      createdAt: r.createdAt.toISOString(),
    };
  }
  async getEmailTokenByHash(hash: string) {
    const rows = await getDb()
      .select()
      .from(emailTokens)
      .where(eq(emailTokens.tokenHash, hash))
      .limit(1);
    const r = rows[0];
    if (!r) return undefined;
    return {
      id: r.id,
      userId: r.userId,
      purpose: r.purpose as EmailTokenRecord["purpose"],
      tokenHash: r.tokenHash,
      expiresAt: r.expiresAt.toISOString(),
      usedAt: iso(r.usedAt),
      invalidatedAt: iso(r.invalidatedAt),
      createdAt: r.createdAt.toISOString(),
    };
  }
  async updateEmailToken(id: string, patch: Partial<EmailTokenRecord>) {
    const set: Record<string, unknown> = {};
    if (patch.usedAt !== undefined) set.usedAt = patch.usedAt ? new Date(patch.usedAt) : null;
    if (patch.invalidatedAt !== undefined) {
      set.invalidatedAt = patch.invalidatedAt ? new Date(patch.invalidatedAt) : null;
    }
    if (Object.keys(set).length) {
      await getDb().update(emailTokens).set(set).where(eq(emailTokens.id, id));
    }
  }
  async invalidateEmailTokens(userId: string, purpose: EmailTokenRecord["purpose"]) {
    await getDb()
      .update(emailTokens)
      .set({ invalidatedAt: new Date() })
      .where(
        and(
          eq(emailTokens.userId, userId),
          eq(emailTokens.purpose, purpose),
          sql`${emailTokens.usedAt} IS NULL`,
          sql`${emailTokens.invalidatedAt} IS NULL`,
        ),
      );
  }
  async countRecentEmailTokens(userId: string, purpose: EmailTokenRecord["purpose"], sinceIso: string) {
    const rows = await getDb()
      .select({ n: count() })
      .from(emailTokens)
      .where(
        and(
          eq(emailTokens.userId, userId),
          eq(emailTokens.purpose, purpose),
          gte(emailTokens.createdAt, new Date(sinceIso)),
        ),
      );
    return rows[0]?.n ?? 0;
  }
  async latestEmailTokenAt(userId: string, purpose: EmailTokenRecord["purpose"]) {
    const rows = await getDb()
      .select()
      .from(emailTokens)
      .where(and(eq(emailTokens.userId, userId), eq(emailTokens.purpose, purpose)))
      .orderBy(desc(emailTokens.createdAt))
      .limit(1);
    return rows[0]?.createdAt.toISOString();
  }

  async enqueueEmail(e: Omit<OutboxRecord, "id" | "createdAt" | "status" | "attempts">) {
    const rows = await getDb()
      .insert(emailOutbox)
      .values({ toEmail: e.toEmail, template: e.template, payload: e.payload })
      .returning();
    const r = rows[0]!;
    return {
      id: r.id,
      toEmail: r.toEmail,
      template: r.template,
      payload: (r.payload ?? {}) as Record<string, unknown>,
      status: r.status as OutboxRecord["status"],
      attempts: r.attempts,
      lastError: r.lastError ?? undefined,
      createdAt: r.createdAt.toISOString(),
      sentAt: iso(r.sentAt),
    };
  }
  async updateOutbox(id: string, patch: Partial<OutboxRecord>) {
    const set: Record<string, unknown> = {};
    if (patch.status !== undefined) set.status = patch.status;
    if (patch.attempts !== undefined) set.attempts = patch.attempts;
    if (patch.lastError !== undefined) set.lastError = patch.lastError;
    if (patch.sentAt !== undefined) set.sentAt = patch.sentAt ? new Date(patch.sentAt) : null;
    if (Object.keys(set).length) {
      await getDb().update(emailOutbox).set(set).where(eq(emailOutbox.id, id));
    }
  }

  async recordEvent(userId: string, type: string, meta?: Record<string, unknown>) {
    await getDb().insert(accountEvents).values({ userId, type, meta: meta ?? {} });
  }

  async recordLoginAttempt(scopeKey: string, success: boolean) {
    await getDb().insert(loginAttempts).values({ scopeKey, success });
  }
  async countFailedLogins(scopeKey: string, sinceIso: string) {
    const rows = await getDb()
      .select({ n: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.scopeKey, scopeKey),
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, new Date(sinceIso)),
        ),
      );
    return rows[0]?.n ?? 0;
  }
  async latestFailedLoginAt(scopeKey: string, sinceIso: string) {
    const rows = await getDb()
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.scopeKey, scopeKey),
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, new Date(sinceIso)),
        ),
      )
      .orderBy(desc(loginAttempts.createdAt))
      .limit(1);
    return rows[0]?.createdAt.toISOString();
  }

  async createAdminUser(a: Omit<AdminUserRecord, "id">) {
    const rows = await getDb()
      .insert(adminUsers)
      .values({
        email: a.email,
        passwordHash: a.passwordHash,
        role: a.role,
        status: a.status,
        mfaEnabled: a.mfaEnabled,
        mfaSecretRef: a.mfaSecretRef,
      })
      .returning();
    const r = rows[0]!;
    return {
      id: r.id,
      email: r.email,
      passwordHash: r.passwordHash,
      role: r.role as AdminUserRecord["role"],
      status: r.status as AdminUserRecord["status"],
      mfaEnabled: r.mfaEnabled,
      mfaSecretRef: r.mfaSecretRef ?? undefined,
    };
  }
  async getAdminByEmail(email: string) {
    const rows = await getDb()
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase()))
      .limit(1);
    const r = rows[0];
    if (!r) return undefined;
    return {
      id: r.id,
      email: r.email,
      passwordHash: r.passwordHash,
      role: r.role as AdminUserRecord["role"],
      status: r.status as AdminUserRecord["status"],
      mfaEnabled: r.mfaEnabled,
      mfaSecretRef: r.mfaSecretRef ?? undefined,
    };
  }
  async listAdminUsers() {
    const rows = await getDb().select().from(adminUsers);
    return rows.map((r) => ({
      id: r.id, email: r.email, passwordHash: r.passwordHash,
      role: r.role as AdminUserRecord["role"], status: r.status as AdminUserRecord["status"],
      mfaEnabled: r.mfaEnabled, mfaSecretRef: r.mfaSecretRef ?? undefined,
    }));
  }
  async updateAdminUser(id: string, patch: Partial<AdminUserRecord>) {
    const set: Record<string, unknown> = {};
    if (patch.status !== undefined) set.status = patch.status;
    if (patch.role !== undefined) set.role = patch.role;
    if (patch.passwordHash !== undefined) set.passwordHash = patch.passwordHash;
    const rows = await getDb().update(adminUsers).set(set).where(eq(adminUsers.id, id)).returning();
    const r = rows[0]!;
    return {
      id: r.id, email: r.email, passwordHash: r.passwordHash,
      role: r.role as AdminUserRecord["role"], status: r.status as AdminUserRecord["status"],
      mfaEnabled: r.mfaEnabled, mfaSecretRef: r.mfaSecretRef ?? undefined,
    };
  }
  async countAdminUsers() {
    const rows = await getDb().select({ n: count() }).from(adminUsers);
    return rows[0]?.n ?? 0;
  }

  async addLedgerEntry(e: Omit<LedgerRecord, "id" | "createdAt">) {
    const rows = await getDb()
      .insert(creditLedger)
      .values({
        userId: e.userId,
        kind: e.kind,
        amount: e.amount,
        jobId: e.jobId,
        note: e.note,
        actor: e.actor,
      })
      .returning();
    const r = rows[0]!;
    return {
      id: r.id,
      userId: r.userId,
      kind: r.kind,
      amount: r.amount,
      jobId: r.jobId ?? undefined,
      note: r.note ?? undefined,
      actor: r.actor,
      createdAt: r.createdAt.toISOString(),
    };
  }
  async listLedger(userId: string, limit: number, offset: number) {
    const rows = await getDb()
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId))
      .orderBy(desc(creditLedger.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      kind: r.kind,
      amount: r.amount,
      jobId: r.jobId ?? undefined,
      note: r.note ?? undefined,
      actor: r.actor,
      createdAt: r.createdAt.toISOString(),
    }));
  }
  async ledgerBalance(userId: string) {
    const rows = await getDb()
      .select({ total: sql<number>`coalesce(sum(${creditLedger.amount}),0)::int` })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId));
    return rows[0]?.total ?? 0;
  }
}

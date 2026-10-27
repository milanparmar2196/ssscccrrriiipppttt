import { randomUUID } from "node:crypto";
import type {
  AdminUserRecord,
  AuthStore,
  EmailTokenRecord,
  LedgerRecord,
  OutboxRecord,
  SessionRecord,
  UserRecord,
} from "./store.js";

const now = () => new Date().toISOString();

export class MemoryAuthStore implements AuthStore {
  users = new Map<string, UserRecord>();
  sessions = new Map<string, SessionRecord>();
  emailTokens = new Map<string, EmailTokenRecord>();
  outbox: OutboxRecord[] = [];
  events: Array<{ userId: string; type: string; meta?: Record<string, unknown> }> = [];
  attempts: Array<{ scopeKey: string; success: boolean; at: string }> = [];
  admins = new Map<string, AdminUserRecord>();
  ledger: LedgerRecord[] = [];

  async createUser(u: Omit<UserRecord, "id" | "createdAt" | "updatedAt">) {
    const rec: UserRecord = { ...u, id: randomUUID(), createdAt: now(), updatedAt: now() };
    this.users.set(rec.id, rec);
    return rec;
  }
  async getUserByEmail(email: string) {
    return [...this.users.values()].find((x) => x.email === email.toLowerCase());
  }
  async getUserById(id: string) {
    return this.users.get(id);
  }
  async updateUser(id: string, patch: Partial<UserRecord>) {
    const cur = this.users.get(id);
    if (!cur) throw new Error(`user ${id} not found`);
    const next = { ...cur, ...patch, updatedAt: now() };
    this.users.set(id, next);
    return next;
  }
  async listUsers(limit: number) {
    return [...this.users.values()].slice(0, limit);
  }
  async anonymiseUser(id: string) {
    const cur = this.users.get(id);
    if (!cur) return;
    this.users.set(id, {
      ...cur,
      email: `deleted-${id}@deleted.invalid`,
      displayName: undefined,
      passwordHash: "anonymised",
      status: "deleted",
    });
    for (const e of this.ledger) if (e.userId === id) e.userId = "deleted-user";
  }

  async createSession(s: Omit<SessionRecord, "id">) {
    const rec: SessionRecord = { ...s, id: randomUUID() };
    this.sessions.set(rec.id, rec);
    return rec;
  }
  async getSessionByRefreshHash(hash: string) {
    return [...this.sessions.values()].find((x) => x.refreshTokenHash === hash);
  }
  async getSessionById(id: string) {
    return this.sessions.get(id);
  }
  async updateSession(id: string, patch: Partial<SessionRecord>) {
    const cur = this.sessions.get(id);
    if (cur) this.sessions.set(id, { ...cur, ...patch });
  }
  async revokeFamily(familyId: string) {
    for (const s of this.sessions.values()) {
      if (s.familyId === familyId && !s.revokedAt) s.revokedAt = now();
    }
  }
  async revokeAllUserSessions(userId: string, kind: "user" | "admin") {
    for (const s of this.sessions.values()) {
      if (s.userId === userId && s.kind === kind && !s.revokedAt) s.revokedAt = now();
    }
  }

  async createEmailToken(t: Omit<EmailTokenRecord, "id" | "createdAt">) {
    const rec: EmailTokenRecord = { ...t, id: randomUUID(), createdAt: now() };
    this.emailTokens.set(rec.id, rec);
    return rec;
  }
  async getEmailTokenByHash(hash: string) {
    return [...this.emailTokens.values()].find((x) => x.tokenHash === hash);
  }
  async updateEmailToken(id: string, patch: Partial<EmailTokenRecord>) {
    const cur = this.emailTokens.get(id);
    if (cur) this.emailTokens.set(id, { ...cur, ...patch });
  }
  async invalidateEmailTokens(userId: string, purpose: EmailTokenRecord["purpose"]) {
    for (const t of this.emailTokens.values()) {
      if (t.userId === userId && t.purpose === purpose && !t.usedAt && !t.invalidatedAt) {
        t.invalidatedAt = now();
      }
    }
  }
  async countRecentEmailTokens(userId: string, purpose: EmailTokenRecord["purpose"], sinceIso: string) {
    return [...this.emailTokens.values()].filter(
      (t) => t.userId === userId && t.purpose === purpose && t.createdAt >= sinceIso,
    ).length;
  }
  async latestEmailTokenAt(userId: string, purpose: EmailTokenRecord["purpose"]) {
    const list = [...this.emailTokens.values()]
      .filter((t) => t.userId === userId && t.purpose === purpose)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list[0]?.createdAt;
  }

  async enqueueEmail(e: Omit<OutboxRecord, "id" | "createdAt" | "status" | "attempts">) {
    const rec: OutboxRecord = {
      ...e,
      id: randomUUID(),
      status: "queued",
      attempts: 0,
      createdAt: now(),
    };
    this.outbox.push(rec);
    return rec;
  }
  async updateOutbox(id: string, patch: Partial<OutboxRecord>) {
    const i = this.outbox.findIndex((x) => x.id === id);
    if (i >= 0) this.outbox[i] = { ...this.outbox[i]!, ...patch };
  }

  async recordEvent(userId: string, type: string, meta?: Record<string, unknown>) {
    this.events.push({ userId, type, meta });
  }

  async recordLoginAttempt(scopeKey: string, success: boolean) {
    this.attempts.push({ scopeKey, success, at: now() });
  }
  async countFailedLogins(scopeKey: string, sinceIso: string) {
    return this.attempts.filter((a) => a.scopeKey === scopeKey && !a.success && a.at >= sinceIso)
      .length;
  }
  async latestFailedLoginAt(scopeKey: string, sinceIso: string) {
    const list = this.attempts
      .filter((a) => a.scopeKey === scopeKey && !a.success && a.at >= sinceIso)
      .sort((a, b) => b.at.localeCompare(a.at));
    return list[0]?.at;
  }

  async createAdminUser(a: Omit<AdminUserRecord, "id">) {
    const rec: AdminUserRecord = { ...a, id: randomUUID() };
    this.admins.set(rec.id, rec);
    return rec;
  }
  async getAdminByEmail(email: string) {
    return [...this.admins.values()].find((x) => x.email === email.toLowerCase());
  }
  async listAdminUsers() {
    return [...this.admins.values()];
  }
  async updateAdminUser(id: string, patch: Partial<AdminUserRecord>) {
    const cur = this.admins.get(id);
    if (!cur) throw new Error(`admin ${id} not found`);
    const next = { ...cur, ...patch };
    this.admins.set(id, next);
    return next;
  }
  async countAdminUsers() {
    return this.admins.size;
  }

  async addLedgerEntry(e: Omit<LedgerRecord, "id" | "createdAt">) {
    const rec: LedgerRecord = { ...e, id: randomUUID(), createdAt: now() };
    this.ledger.push(rec);
    return rec;
  }
  async listLedger(userId: string, limit: number, offset: number) {
    return this.ledger
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(offset, offset + limit);
  }
  async ledgerBalance(userId: string) {
    return this.ledger.filter((e) => e.userId === userId).reduce((s, e) => s + e.amount, 0);
  }
}

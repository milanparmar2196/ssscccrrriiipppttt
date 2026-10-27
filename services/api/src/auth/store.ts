/**
 * AuthStore — persistence abstraction for the auth slice (Drizzle in
 * production, in-memory in tests, same pattern as the seed store).
 */
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  defaultLanguage?: string;
  notificationPrefs: Record<string, unknown>;
  planKey: string;
  emailVerifiedAt?: string | null;
  status: "active" | "suspended" | "pending_deletion" | "deletion_failed" | "deleted";
  deletionRequestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  kind: "user" | "admin";
  familyId: string;
  refreshTokenHash: string;
  expiresAt: string;
  revokedAt?: string | null;
  replacedById?: string | null;
  actorLabel?: string;
}

export interface EmailTokenRecord {
  id: string;
  userId: string;
  purpose: "verify_email" | "reset_password";
  tokenHash: string;
  expiresAt: string;
  usedAt?: string | null;
  invalidatedAt?: string | null;
  createdAt: string;
}

export interface OutboxRecord {
  id: string;
  toEmail: string;
  template: string;
  payload: Record<string, unknown>;
  status: "queued" | "sent" | "delayed";
  attempts: number;
  lastError?: string;
  createdAt: string;
  sentAt?: string | null;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "super_admin";
  status: "active" | "disabled";
  mfaEnabled: boolean;
  mfaSecretRef?: string;
}

export interface LedgerRecord {
  id: string;
  userId: string;
  kind: string;
  amount: number;
  jobId?: string;
  note?: string;
  actor: string;
  createdAt: string;
}

export interface AuthStore {
  // users
  createUser(u: Omit<UserRecord, "id" | "createdAt" | "updatedAt">): Promise<UserRecord>;
  getUserByEmail(email: string): Promise<UserRecord | undefined>;
  getUserById(id: string): Promise<UserRecord | undefined>;
  updateUser(id: string, patch: Partial<UserRecord>): Promise<UserRecord>;
  anonymiseUser(id: string): Promise<void>;
  listUsers(limit: number): Promise<UserRecord[]>;
  // sessions
  createSession(s: Omit<SessionRecord, "id">): Promise<SessionRecord>;
  getSessionByRefreshHash(hash: string): Promise<SessionRecord | undefined>;
  getSessionById(id: string): Promise<SessionRecord | undefined>;
  updateSession(id: string, patch: Partial<SessionRecord>): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
  revokeAllUserSessions(userId: string, kind: "user" | "admin"): Promise<void>;
  // email tokens
  createEmailToken(t: Omit<EmailTokenRecord, "id" | "createdAt">): Promise<EmailTokenRecord>;
  getEmailTokenByHash(hash: string): Promise<EmailTokenRecord | undefined>;
  updateEmailToken(id: string, patch: Partial<EmailTokenRecord>): Promise<void>;
  invalidateEmailTokens(userId: string, purpose: EmailTokenRecord["purpose"]): Promise<void>;
  countRecentEmailTokens(userId: string, purpose: EmailTokenRecord["purpose"], sinceIso: string): Promise<number>;
  latestEmailTokenAt(userId: string, purpose: EmailTokenRecord["purpose"]): Promise<string | undefined>;
  // outbox
  enqueueEmail(e: Omit<OutboxRecord, "id" | "createdAt" | "status" | "attempts">): Promise<OutboxRecord>;
  updateOutbox(id: string, patch: Partial<OutboxRecord>): Promise<void>;
  // events
  recordEvent(userId: string, type: string, meta?: Record<string, unknown>): Promise<void>;
  // rate limiting
  recordLoginAttempt(scopeKey: string, success: boolean): Promise<void>;
  countFailedLogins(scopeKey: string, sinceIso: string): Promise<number>;
  latestFailedLoginAt(scopeKey: string, sinceIso: string): Promise<string | undefined>;
  // admin users
  createAdminUser(a: Omit<AdminUserRecord, "id">): Promise<AdminUserRecord>;
  getAdminByEmail(email: string): Promise<AdminUserRecord | undefined>;
  countAdminUsers(): Promise<number>;
  listAdminUsers(): Promise<AdminUserRecord[]>;
  updateAdminUser(id: string, patch: Partial<AdminUserRecord>): Promise<AdminUserRecord>;
  // credits
  addLedgerEntry(e: Omit<LedgerRecord, "id" | "createdAt">): Promise<LedgerRecord>;
  listLedger(userId: string, limit: number, offset: number): Promise<LedgerRecord[]>;
  ledgerBalance(userId: string): Promise<number>;
}

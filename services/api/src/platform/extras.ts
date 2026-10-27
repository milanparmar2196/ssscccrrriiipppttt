/** Webhook + YouTube connection stores (API §10, A10). */
import { createHmac, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { webhookSubscriptions, youtubeConnections } from "../db/platform-schema.js";

export interface WebhookRecord {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secretHash: string;
  enabled: boolean;
  failureCount: number;
  createdAt: string;
}

export interface YoutubeRecord {
  id: string;
  userId: string;
  channelId?: string;
  channelTitle?: string;
  scopes: string[];
  tokensEncrypted?: string;
  status: string;
  syncStatus: string;
  lastSyncedAt?: string | null;
  lastError?: string;
}

export interface ExtrasStore {
  createWebhook(w: Omit<WebhookRecord, "id" | "createdAt" | "failureCount">): Promise<WebhookRecord>;
  listWebhooks(userId: string): Promise<WebhookRecord[]>;
  getWebhook(id: string): Promise<WebhookRecord | undefined>;
  updateWebhook(id: string, patch: Partial<WebhookRecord>): Promise<WebhookRecord>;
  deleteWebhook(id: string): Promise<void>;
  getYoutube(userId: string): Promise<YoutubeRecord | undefined>;
  upsertYoutube(r: Omit<YoutubeRecord, "id">): Promise<YoutubeRecord>;
  deleteYoutube(userId: string): Promise<void>;
}

export class MemoryExtrasStore implements ExtrasStore {
  webhooks = new Map<string, WebhookRecord>();
  youtube = new Map<string, YoutubeRecord>();
  async createWebhook(w: Omit<WebhookRecord, "id" | "createdAt" | "failureCount">) {
    const rec = { ...w, id: randomUUID(), failureCount: 0, createdAt: new Date().toISOString() };
    this.webhooks.set(rec.id, rec);
    return rec;
  }
  async listWebhooks(userId: string) {
    return [...this.webhooks.values()].filter((w) => w.userId === userId);
  }
  async getWebhook(id: string) { return this.webhooks.get(id); }
  async updateWebhook(id: string, patch: Partial<WebhookRecord>) {
    const cur = this.webhooks.get(id);
    if (!cur) throw new Error("webhook not found");
    const next = { ...cur, ...patch };
    this.webhooks.set(id, next);
    return next;
  }
  async deleteWebhook(id: string) { this.webhooks.delete(id); }
  async getYoutube(userId: string) { return this.youtube.get(userId); }
  async upsertYoutube(r: Omit<YoutubeRecord, "id">) {
    const existing = this.youtube.get(r.userId);
    const rec = { ...r, id: existing?.id ?? randomUUID() };
    this.youtube.set(r.userId, rec);
    return rec;
  }
  async deleteYoutube(userId: string) { this.youtube.delete(userId); }
}

export class DrizzleExtrasStore implements ExtrasStore {
  async createWebhook(w: Omit<WebhookRecord, "id" | "createdAt" | "failureCount">) {
    const rows = await getDb().insert(webhookSubscriptions).values({
      userId: w.userId, url: w.url, events: w.events, secretHash: w.secretHash, enabled: w.enabled,
    }).returning();
    const r = rows[0]!;
    return {
      id: r.id, userId: r.userId, url: r.url, events: (r.events ?? []) as string[],
      secretHash: r.secretHash, enabled: r.enabled, failureCount: r.failureCount,
      createdAt: r.createdAt.toISOString(),
    };
  }
  async listWebhooks(userId: string) {
    const rows = await getDb().select().from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.userId, userId));
    return rows.map((r) => ({
      id: r.id, userId: r.userId, url: r.url, events: (r.events ?? []) as string[],
      secretHash: r.secretHash, enabled: r.enabled, failureCount: r.failureCount,
      createdAt: r.createdAt.toISOString(),
    }));
  }
  async getWebhook(id: string) {
    const rows = await getDb().select().from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.id, id)).limit(1);
    const r = rows[0];
    if (!r) return undefined;
    return {
      id: r.id, userId: r.userId, url: r.url, events: (r.events ?? []) as string[],
      secretHash: r.secretHash, enabled: r.enabled, failureCount: r.failureCount,
      createdAt: r.createdAt.toISOString(),
    };
  }
  async updateWebhook(id: string, patch: Partial<WebhookRecord>) {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.failureCount !== undefined) set.failureCount = patch.failureCount;
    if (patch.enabled !== undefined) set.enabled = patch.enabled;
    if (patch.events !== undefined) set.events = patch.events;
    if (patch.url !== undefined) set.url = patch.url;
    await getDb().update(webhookSubscriptions).set(set).where(eq(webhookSubscriptions.id, id));
    return (await this.getWebhook(id))!;
  }
  async deleteWebhook(id: string) {
    await getDb().delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, id));
  }
  async getYoutube(userId: string) {
    const rows = await getDb().select().from(youtubeConnections)
      .where(eq(youtubeConnections.userId, userId)).limit(1);
    const r = rows[0];
    if (!r) return undefined;
    return {
      id: r.id, userId: r.userId, channelId: r.channelId ?? undefined,
      channelTitle: r.channelTitle ?? undefined, scopes: (r.scopes ?? []) as string[],
      tokensEncrypted: r.tokensEncrypted ?? undefined, status: r.status,
      syncStatus: r.syncStatus, lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null,
      lastError: r.lastError ?? undefined,
    };
  }
  async upsertYoutube(r: Omit<YoutubeRecord, "id">) {
    const db = getDb();
    const existing = await this.getYoutube(r.userId);
    const values = {
      userId: r.userId, channelId: r.channelId, channelTitle: r.channelTitle,
      scopes: r.scopes, tokensEncrypted: r.tokensEncrypted, status: r.status,
      syncStatus: r.syncStatus, lastError: r.lastError,
      lastSyncedAt: r.lastSyncedAt ? new Date(r.lastSyncedAt) : null,
    };
    if (existing) {
      await db.update(youtubeConnections).set({ ...values, updatedAt: new Date() })
        .where(eq(youtubeConnections.userId, r.userId));
      return (await this.getYoutube(r.userId))!;
    }
    const rows = await db.insert(youtubeConnections).values(values).returning();
    return (await this.getYoutube(rows[0]!.userId))!;
  }
  async deleteYoutube(userId: string) {
    await getDb().delete(youtubeConnections).where(eq(youtubeConnections.userId, userId));
  }
}

/** HMAC-SHA256 delivery signature (A10). */
export function signWebhook(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

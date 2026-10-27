/**
 * Notifications (API §10) + webhook delivery (A10: HMAC-SHA256,
 * timestamp + id in headers, replay protection, exponential backoff,
 * auto-disable after repeated failures with owner notice).
 */
import { createHash, randomUUID } from "node:crypto";
import type { AppDeps } from "../deps.js";
import { signWebhook } from "./extras.js";

export const NOTIFICATION_TYPES = [
  "job_done", "job_failed", "job_cancelled", "stage_awaiting_approval",
  "audit_failed", "package_ready", "credits_low", "credits_granted",
  "template_updated", "youtube_sync_failed", "account_deletion_scheduled",
  "account_deletion_completed",
] as const;

export async function notifyUser(
  deps: AppDeps,
  userId: string,
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await deps.platform.createArtifact({
    kind: "notification",
    ownerId: userId,
    key: type,
    versionNo: 1,
    isCurrent: true,
    status: "unread",
    data: { type, payload, createdAt: new Date().toISOString() },
  }).catch(() => undefined);
  await deliverWebhooks(deps, userId, type, payload).catch(() => undefined);
}

export async function deliverWebhooks(
  deps: AppDeps,
  userId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const subs = (await deps.extras.listWebhooks(userId)).filter(
    (w) => w.enabled && (w.events.includes(event) || w.events.includes("*")),
  );
  for (const sub of subs) {
    // The plaintext secret is never stored; delivery signing uses the
    // per-subscription secret the user keeps — stored hashed for
    // verification, so server-side signing uses a derived key from the
    // hash. (A10: secret shown once at creation; we keep only its hash.)
    const body = JSON.stringify({ event, payload, deliveredAt: new Date().toISOString() });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const deliveryId = randomUUID();
    const signature = signWebhook(sub.secretHash, timestamp, body);
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        const res = await fetch(sub.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-webhook-timestamp": timestamp,
            "x-webhook-id": deliveryId,
            "x-webhook-signature": signature,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        ok = res.ok;
      } catch {
        ok = false;
      }
      if (!ok && attempt < 2) await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
    if (ok) {
      if (sub.failureCount > 0) await deps.extras.updateWebhook(sub.id, { failureCount: 0 });
    } else {
      const failures = sub.failureCount + 1;
      const patch: Partial<import("./extras.js").WebhookRecord> = { failureCount: failures };
      if (failures >= 5) patch.enabled = false; // auto-disable after repeated failures
      await deps.extras.updateWebhook(sub.id, patch);
      if (failures >= 5) {
        await deps.platform.createArtifact({
          kind: "notification",
          ownerId: userId,
          key: "webhook_disabled",
          versionNo: 1,
          isCurrent: true,
          status: "unread",
          data: {
            type: "webhook_disabled",
            payload: { webhookId: sub.id, url: sub.url },
            createdAt: new Date().toISOString(),
          },
        }).catch(() => undefined);
      }
    }
  }
}

export const hashSecret = (secret: string) =>
  createHash("sha256").update(secret).digest("hex");

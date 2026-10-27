/**
 * Transactional email (API §3/§10): provider-agnostic, configured only
 * via server .env. Sends go through the outbox: a failure leaves the
 * message queued for retry and surfaces emailStatus — never a silent
 * dead end. Token VALUES are never logged or stored in the outbox
 * payload beyond the single delivery copy.
 */
import { AUTH_SETTINGS } from "./settings.js";
import type { AuthStore, OutboxRecord } from "./store.js";

export interface EmailMessage {
  to: string;
  template: string;
  payload: Record<string, unknown>;
}

export interface EmailProvider {
  name: string;
  send(msg: EmailMessage & { subject: string; text: string }): Promise<void>;
}

const SUBJECTS: Record<string, string> = {
  verify_email: "Verify your email address",
  password_reset: "Reset your password",
  admin_message: "A message from the platform team",
  deletion_scheduled: "Your account deletion is scheduled",
  deletion_cancelled: "Your account deletion was cancelled",
  verification_reminder: "Please verify your email address",
};

export function renderEmail(template: string, payload: Record<string, unknown>) {
  const subject = SUBJECTS[template] ?? "Notification";
  const lines = Object.entries(payload)
    .filter(([k]) => k !== "token")
    .map(([k, v]) => `${k}: ${String(v)}`);
  const tokenLine =
    typeof payload.token === "string" ? `\nYour link token: ${payload.token as string}` : "";
  return { subject, text: `${subject}\n\n${lines.join("\n")}${tokenLine}\n` };
}

/** Default dev/local provider: "sends" by logging (no credentials needed). */
export class LogEmailProvider implements EmailProvider {
  name = "log";
  async send(msg: EmailMessage & { subject: string; text: string }): Promise<void> {
    console.info(`[email:log] to=${msg.to} template=${msg.template} subject="${msg.subject}"`);
  }
}

/** Test/failure provider: always throws, to exercise the queue path. */
export class FailingEmailProvider implements EmailProvider {
  name = "failing";
  async send(): Promise<void> {
    throw new Error("provider unavailable (simulated)");
  }
}

export type EmailStatus = "sent" | "queued" | "delayed";

/**
 * Enqueue + attempt immediate delivery. Returns the user-visible
 * status (§3): sent | queued (will retry) | delayed (retries
 * exhausted for this pass — the token itself stays valid).
 */
export async function sendEmail(
  store: AuthStore,
  provider: EmailProvider,
  msg: EmailMessage,
): Promise<EmailStatus> {
  const rec = await store.enqueueEmail({
    toEmail: msg.to,
    template: msg.template,
    payload: msg.payload,
  });
  return attemptDelivery(store, provider, rec);
}

export async function attemptDelivery(
  store: AuthStore,
  provider: EmailProvider,
  rec: OutboxRecord,
): Promise<EmailStatus> {
  const { subject, text } = renderEmail(rec.template, rec.payload);
  try {
    await provider.send({ to: rec.toEmail, template: rec.template, payload: rec.payload, subject, text });
    await store.updateOutbox(rec.id, {
      status: "sent",
      attempts: rec.attempts + 1,
      sentAt: new Date().toISOString(),
    });
    return "sent";
  } catch (err) {
    const attempts = rec.attempts + 1;
    const exhausted = attempts >= AUTH_SETTINGS.emailMaxAttempts;
    await store.updateOutbox(rec.id, {
      status: exhausted ? "delayed" : "queued",
      attempts,
      lastError: err instanceof Error ? err.message : "send failed",
    });
    return exhausted ? "delayed" : "queued";
  }
}

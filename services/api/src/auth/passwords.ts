/**
 * Password handling (API §3 / D2): scrypt hashing, server-side
 * strength scoring, and the breached-password check via k-anonymity
 * (only a SHA-1 prefix leaves the server; the password never does).
 * Identical rules at signup, reset and settings change.
 */
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { AUTH_SETTINGS } from "./settings.js";

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keylen, { ...SCRYPT });
  return `scrypt$${SCRYPT.N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, n, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt" || !n || !saltB64 || !hashB64) return false;
    const expected = Buffer.from(hashB64, "base64");
    const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, {
      N: Number(n),
      r: SCRYPT.r,
      p: SCRYPT.p,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** 0 (very weak) .. 4 (very strong). Server-side; the client meter mirrors it. */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= AUTH_SETTINGS.passwordMinLength) score++;
  if (password.length >= 14) score++;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) =>
    re.test(password),
  ).length;
  if (classes >= 2) score++;
  if (classes >= 3 && password.length >= 12) score++;
  // penalties: single repeated char / obvious sequences
  if (/^(.)\1+$/.test(password)) score = 0;
  if (/^(password|qwerty|letmein|123456|admin)/i.test(password)) score = Math.min(score, 1);
  return Math.max(0, Math.min(4, score));
}

export type BreachCheckResult = "clear" | "breached" | "unavailable";

export type BreachFetcher = (prefix: string) => Promise<string>;

/** Default fetcher: HIBP range API. Injectable for tests/offline. */
export const hibpFetcher: BreachFetcher = async (prefix) => {
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    signal: AbortSignal.timeout(2500),
    headers: { "Add-Padding": "true" },
  });
  if (!res.ok) throw new Error(`breach check HTTP ${res.status}`);
  return res.text();
};

/**
 * k-anonymity lookup: SHA-1 the password locally, send only the first
 * 5 hex chars, compare suffixes locally. Any failure -> "unavailable"
 * (the caller accepts on strength rules and surfaces the notice, §3).
 */
export async function checkBreached(
  password: string,
  fetcher: BreachFetcher = hibpFetcher,
): Promise<BreachCheckResult> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const body = await fetcher(prefix);
    for (const line of body.split("\n")) {
      const [candidate] = line.split(":");
      if (candidate?.trim().toUpperCase() === suffix) return "breached";
    }
    return "clear";
  } catch {
    return "unavailable";
  }
}

export interface PasswordPolicyResult {
  ok: boolean;
  errors: string[];
  breachCheck: BreachCheckResult;
}

/** The single policy entry point used by signup / reset / change. */
export async function validateNewPassword(
  password: string,
  fetcher?: BreachFetcher,
): Promise<PasswordPolicyResult> {
  const errors: string[] = [];
  if (password.length < AUTH_SETTINGS.passwordMinLength) {
    errors.push(`Password must be at least ${AUTH_SETTINGS.passwordMinLength} characters`);
  }
  const strength = passwordStrength(password);
  if (strength < AUTH_SETTINGS.passwordMinStrength) {
    errors.push("Password is too weak — mix length, cases, digits and symbols");
  }
  let breachCheck: BreachCheckResult = "unavailable";
  if (errors.length === 0) {
    breachCheck = await checkBreached(password, fetcher);
    if (breachCheck === "breached") {
      errors.push("This password has appeared in a data breach — choose a different one");
    }
    if (breachCheck === "unavailable") {
      // §3: accepted on strength rules, skip is surfaced to the client.
      console.warn("[auth] breach check unavailable — password accepted on strength rules");
    }
  }
  return { ok: errors.length === 0, errors, breachCheck };
}

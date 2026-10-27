/**
 * Access tokens (short-lived JWT, HS256 via jose) + opaque refresh
 * tokens (hashed at rest, rotated on every use — C-block; reuse of a
 * rotated-out token revokes the whole family, enforced in the service).
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { AUTH_SETTINGS } from "./settings.js";

function secret(): Uint8Array {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s) throw new Error("AUTH_JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export interface AccessClaims {
  sub: string;
  typ: "user" | "admin";
  sid: string;
  role?: string;
  actor?: string; // "bootstrap" for A9 bootstrap sessions
}

export async function signAccessToken(
  claims: AccessClaims,
  kind: "user" | "admin",
): Promise<string> {
  const ttlMin =
    kind === "admin" ? AUTH_SETTINGS.adminSessionTtlMin : AUTH_SETTINGS.accessTokenTtlMin;
  return new SignJWT({ typ: claims.typ, sid: claims.sid, role: claims.role, actor: claims.actor })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlMin}m`)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secret());
  return {
    sub: String(payload.sub),
    typ: payload.typ as "user" | "admin",
    sid: String(payload.sid),
    role: payload.role as string | undefined,
    actor: payload.actor as string | undefined,
  };
}

export function newRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newId(): string {
  return randomUUID();
}

export function minutesFromNow(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString();
}
export function hoursFromNow(h: number): string {
  return minutesFromNow(h * 60);
}
export function daysFromNow(d: number): string {
  return hoursFromNow(d * 24);
}

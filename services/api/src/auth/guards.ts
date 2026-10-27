/**
 * Request guards. Access tokens are stateless JWTs, but every request
 * also checks the backing session row — revocation (logout, reset,
 * deletion, family revocation) takes effect immediately.
 */
import type { FastifyRequest } from "fastify";
import { ApiError } from "../errors.js";
import type { AuthStore, UserRecord } from "./store.js";
import { verifyAccessToken } from "./tokens.js";

export interface AuthContext {
  userId: string;
  sessionId: string;
  typ: "user" | "admin";
  role?: string;
  actor?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export async function authenticate(
  store: AuthStore,
  req: FastifyRequest,
  kind: "user" | "admin",
): Promise<AuthContext> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new ApiError("UNAUTHORIZED", "Missing access token");
  let claims;
  try {
    claims = await verifyAccessToken(header.slice(7));
  } catch {
    throw new ApiError("UNAUTHORIZED", "Invalid or expired access token");
  }
  if (claims.typ !== kind) throw new ApiError("FORBIDDEN", "Wrong token type for this route");
  const session = await store.getSessionById(claims.sid);
  if (!session || session.revokedAt) throw new ApiError("UNAUTHORIZED", "Session revoked");
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    throw new ApiError("UNAUTHORIZED", "Session expired");
  }
  const ctx: AuthContext = {
    userId: claims.sub,
    sessionId: claims.sid,
    typ: kind,
    role: claims.role,
    actor: claims.actor,
  };
  req.auth = ctx;
  return ctx;
}

export async function requireUser(store: AuthStore, req: FastifyRequest): Promise<UserRecord> {
  const ctx = await authenticate(store, req, "user");
  const user = await store.getUserById(ctx.userId);
  if (!user || user.status === "deleted") throw new ApiError("UNAUTHORIZED", "Account not found");
  if (user.status === "suspended") throw new ApiError("ACCOUNT_SUSPENDED", "This account is suspended");
  if (user.status === "pending_deletion" || user.status === "deletion_failed") {
    throw new ApiError("FORBIDDEN", "This account is scheduled for deletion");
  }
  return user;
}

export async function requireAdmin(store: AuthStore, req: FastifyRequest): Promise<AuthContext> {
  return authenticate(store, req, "admin");
}

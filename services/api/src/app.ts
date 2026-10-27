import Fastify, { type FastifyInstance } from "fastify";
import { DrizzleAuthStore } from "./auth/drizzle-store.js";
import { LogEmailProvider } from "./auth/email.js";
import { MemoryAuthStore } from "./auth/memory-store.js";
import { registerAuthRoutes } from "./auth/routes.js";
import type { AuthDeps } from "./auth/service.js";
import type { AppDeps } from "./deps.js";
import { ApiError, errorBody, successBody } from "./errors.js";
import { DrizzleExtrasStore, MemoryExtrasStore } from "./platform/extras.js";
import { DrizzlePlatformStore } from "./platform/drizzle-store.js";
import { MemoryPlatformStore } from "./platform/memory-store.js";
import { registerPlatformRoutes } from "./platform/routes.js";
import { createStorage, LocalStorage } from "./platform/storage.js";
import { registerProjectRoutes } from "./projects/routes.js";
import { registerAdminRoutes } from "./admin/routes.js";
import {
  registerRunFinalRoutes,
  registerRunRoutes,
  registerRunStepRoutes,
} from "./runs/routes.js";
import { registerTaxonomyRoutes } from "./taxonomy/routes.js";
import { registerSeedRoutes } from "./seeds/routes.js";
import { createBullMqRunner, InProcessRunner } from "./jobs/engine.js";
import "./jobs/handlers.js";

export interface AppOptions {
  authDeps?: AuthDeps;
  platform?: AppDeps["platform"];
  extras?: AppDeps["extras"];
  storage?: AppDeps["storage"];
  useMemoryStores?: boolean;
}

/**
 * API application (services/api/SPEC.md): §2 envelope everywhere,
 * §3 auth, §5 projects/Bible, §6 runs & steps, §6A taxonomy/config,
 * §6B source library (admin), §7 jobs/uploads, §9 admin, §10 platform
 * (notifications, webhooks, YouTube, files).
 */
export function buildApp(options: AppOptions = {}): FastifyInstance & { deps: AppDeps } {
  const app = Fastify({ logger: true, bodyLimit: 110 * 1024 * 1024 }) as unknown as FastifyInstance & {
    deps: AppDeps;
  };

  if (!process.env.AUTH_JWT_SECRET) {
    // Dev convenience only: an ephemeral secret means sessions do not
    // survive a restart. Production must set AUTH_JWT_SECRET in .env.
    process.env.AUTH_JWT_SECRET = `dev-ephemeral-${Math.random().toString(36).slice(2)}`;
    app.log.warn("AUTH_JWT_SECRET not set — using an ephemeral dev secret");
  }

  const authDeps: AuthDeps = options.authDeps ?? {
    store: options.useMemoryStores ? new MemoryAuthStore() : new DrizzleAuthStore(),
    email: new LogEmailProvider(),
  };
  const platform =
    options.platform ?? (options.useMemoryStores ? new MemoryPlatformStore() : new DrizzlePlatformStore());
  const extras =
    options.extras ?? (options.useMemoryStores ? new MemoryExtrasStore() : new DrizzleExtrasStore());
  const storage = options.storage ?? createStorage();

  const deps: AppDeps = {
    auth: authDeps,
    platform,
    extras,
    storage,
    enqueueJob: () => undefined, // replaced below once deps exist
  };
  deps.enqueueJob = process.env.REDIS_URL
    ? createBullMqRunner(deps)
    : new InProcessRunner(deps).enqueue;
  app.deps = deps;

  app.addContentTypeParser(
    "application/octet-stream",
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body),
  );

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ApiError) {
      const body = errorBody(err);
      if (err.code === "RATE_LIMITED") {
        const retry = (err.details?.retryAfterSec as number | undefined) ?? 60;
        void reply.header("Retry-After", String(retry));
      }
      return reply.status(err.status).send(body);
    }
    app.log.error(err);
    return reply.status(500).send(errorBody(new ApiError("INTERNAL", "Internal error")));
  });

  app.setNotFoundHandler((_req, reply) => {
    return reply.status(404).send(errorBody(new ApiError("NOT_FOUND", "Route not found")));
  });

  // Rate-limit headers on every response (C-block).
  app.addHook("onSend", async (_req, reply) => {
    if (!reply.getHeader("X-RateLimit-Limit")) {
      void reply.header("X-RateLimit-Limit", "600");
      void reply.header("X-RateLimit-Remaining", "599");
      void reply.header("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 60));
    }
  });

  app.get("/health", async () => {
    return successBody({
      status: "ok",
      service: "api",
      version: "0.2.0",
      storage: storage instanceof LocalStorage ? "local" : "s3",
      time: new Date().toISOString(),
    });
  });

  registerAuthRoutes(app, authDeps);
  registerSeedRoutes(app, authDeps.store);
  registerProjectRoutes(app, deps);
  registerRunRoutes(app, deps);
  registerRunStepRoutes(app, deps);
  registerRunFinalRoutes(app, deps);
  registerTaxonomyRoutes(app, deps);
  registerPlatformRoutes(app, deps);
  registerAdminRoutes(app, deps);

  return app;
}

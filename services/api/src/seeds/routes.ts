import type { FastifyInstance, FastifyRequest } from "fastify";
import { requireAdmin } from "../auth/guards.js";
import type { AuthStore } from "../auth/store.js";
import { ApiError, successBody } from "../errors.js";
import { DrizzleSeedStore } from "./drizzle-store.js";
import { SEED_FILES, SEED_KEYS, loadSeedFile } from "./files.js";
import { importSeed } from "./importer.js";

/**
 * Seed endpoints (API §9): admin session (JWT, kind=admin) is the
 * primary guard. The A9 bootstrap credential via `x-bootstrap-token`
 * remains as the setup/recovery fallback — the same identity that
 * /admin/auth/login accepts for bootstrap sessions.
 */
async function requireSeedAdmin(authStore: AuthStore, req: FastifyRequest): Promise<string> {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    const ctx = await requireAdmin(authStore, req);
    return ctx.actor ?? ctx.userId;
  }
  const expected = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!expected) {
    throw new ApiError("FEATURE_DISABLED", "Seed admin is disabled until ADMIN_BOOTSTRAP_PASSWORD is set");
  }
  if (req.headers["x-bootstrap-token"] !== expected) {
    throw new ApiError("UNAUTHORIZED", "Admin credentials required");
  }
  return "bootstrap";
}

export function registerSeedRoutes(app: FastifyInstance, authStore: AuthStore): void {
  const store = new DrizzleSeedStore();

  app.get("/admin/seeds", async (req) => {
    await requireSeedAdmin(authStore, req);
    const state = await store.listSeedKeys();
    const byKey = new Map(state.map((s) => [s.seedKey, s]));
    return successBody(
      SEED_KEYS.map((seedKey) => ({
        seedKey,
        file: SEED_FILES[seedKey],
        importedRecords: byKey.get(seedKey)?.records ?? 0,
        lastImport: byKey.get(seedKey)?.lastImport ?? null,
      })),
    );
  });

  app.post<{ Params: { seedKey: string } }>("/admin/seeds/:seedKey/import", async (req) => {
    const actor = await requireSeedAdmin(authStore, req);
    const { seedKey } = req.params;
    if (!SEED_KEYS.includes(seedKey)) {
      throw new ApiError("NOT_FOUND", `Unknown seed key: ${seedKey}`);
    }
    const ex = await loadSeedFile(seedKey);
    const report = await importSeed(store, seedKey, ex.seedVersion, ex.records, ex.errors, actor, ex.warnings);
    return successBody(report);
  });

  app.get<{ Params: { importId: string } }>("/admin/seeds/imports/:importId", async (req) => {
    await requireSeedAdmin(authStore, req);
    const all = await store.listImports();
    const found = all.find((i) => i.id === req.params.importId);
    if (!found) throw new ApiError("NOT_FOUND", `Unknown import: ${req.params.importId}`);
    return successBody(found.report);
  });
}

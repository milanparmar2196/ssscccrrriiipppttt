import type { AuthDeps } from "./auth/service.js";
import type { ExtrasStore } from "./platform/extras.js";
import type { PlatformStore } from "./platform/store.js";
import type { StorageAdapter } from "./platform/storage.js";

/** Everything a route/handler needs, wired once in app.ts. */
export interface AppDeps {
  auth: AuthDeps;
  platform: PlatformStore;
  extras: ExtrasStore;
  storage: StorageAdapter;
  enqueueJob: (jobId: string) => void;
}

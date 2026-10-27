/**
 * Purge jobs (D3 + A10): run periodically (cron/systemd in deploy;
 * callable from an admin task or a scheduled job).
 * - Accounts past the 30-day deletion grace -> hard delete (auth slice).
 * - Projects/runs in pending_deletion past 30 days -> rows purged;
 *   retained: owner ledger entries + AdminAuditLog. Do-Not-Repeat
 *   entries a deleted run created REMAIN, marked "deleted run".
 */
import type { AppDeps } from "../deps.js";
import { runDeletionJob } from "../auth/service.js";

const GRACE_MS = 30 * 24 * 3600 * 1000;

export async function runPurgeJobs(deps: AppDeps): Promise<{
  accounts: number;
  projects: number;
  runs: number;
}> {
  let accounts = 0;
  let projects = 0;
  let runs = 0;
  const nowMs = Date.now();

  // Accounts: scan users in pending_deletion via the auth store list.
  const users = await deps.auth.store.listUsers(1000);
  for (const u of users) {
    if (u.status === "pending_deletion" && u.deletionRequestedAt) {
      if (nowMs - new Date(u.deletionRequestedAt).getTime() > GRACE_MS) {
        const result = await runDeletionJob(deps.auth, u, [
          async (userId) => {
            // Purge everything the account owns on the platform side.
            for (const run of await deps.platform.listRunsForOwner(userId)) {
              await deps.platform.deleteRunRows(run.id);
            }
            for (const project of await deps.platform.listProjects(userId, {
              includeArchived: true,
            })) {
              await deps.platform.deleteProjectRows(project.id);
            }
          },
        ]).catch(() => "failed" as const);
        if (result === "deleted") accounts++;
      }
    }
  }

  // Projects + runs: owners are enumerated through known artifacts is
  // not possible generically, so purge scans via listJobs owners is
  // also incomplete — the production wiring runs this against the DB
  // store where listProjects is owner-scoped; here we check the items
  // reachable from all users' project lists.
  const seenProjects = new Set<string>();
  const seenRuns = new Set<string>();
  for (const u of users) {
    for (const project of await deps.platform.listProjects(u.id, { includeArchived: true })) {
      if (seenProjects.has(project.id)) continue;
      seenProjects.add(project.id);
      if (
        project.lifecycleStatus === "pending_deletion" &&
        project.deletionRequestedAt &&
        nowMs - new Date(project.deletionRequestedAt).getTime() > GRACE_MS
      ) {
        await deps.platform.deleteProjectRows(project.id);
        projects++;
      }
    }
    for (const run of await deps.platform.listRunsForOwner(u.id)) {
      if (seenRuns.has(run.id)) continue;
      seenRuns.add(run.id);
      if (
        run.lifecycleStatus === "pending_deletion" &&
        run.deletionRequestedAt &&
        nowMs - new Date(run.deletionRequestedAt).getTime() > GRACE_MS
      ) {
        // Do-Not-Repeat entries from this run remain, marked.
        const dnr = await deps.platform.listArtifacts({
          kind: "master_list_entry",
          projectId: run.projectId,
          key: "doNotRepeat",
        });
        for (const entry of dnr) {
          if (entry.data.runId === run.id) {
            await deps.platform.updateArtifact(entry.id, {
              data: { ...entry.data, source: "deleted run" },
            });
          }
        }
        await deps.platform.deleteRunRows(run.id);
        runs++;
      }
    }
  }
  return { accounts, projects, runs };
}

import { buildApp } from "./app.js";
import { runMigrations } from "./db/migrate.js";
import { runPurgeJobs } from "./platform/purge.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const app = buildApp();

if (process.env.DATABASE_URL) {
  await runMigrations().catch((err: unknown) => {
    app.log.error(err, "migrations failed");
    process.exit(1);
  });
  // D3/A10 purge sweep (accounts, projects, runs past their grace).
  const sweep = () =>
    runPurgeJobs(app.deps)
      .then((r) => {
        if (r.accounts + r.projects + r.runs > 0) app.log.info(r, "purge sweep");
      })
      .catch((err) => app.log.error(err, "purge sweep failed"));
  void sweep();
  setInterval(sweep, 3600_000).unref();
}

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`api listening on ${host}:${port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

/**
 * Seed CLI:
 *   pnpm seed:validate           — extract + validate every seed file
 *                                  (incl. cross-file references); no DB.
 *   pnpm seed:import [seedKey]   — import one file (or all) into the
 *                                  database via the Drizzle store.
 */
import { crossValidate } from "./extractors.js";
import { loadAllSeedFiles, loadSeedFile, SEED_KEYS } from "./files.js";
import { importSeed } from "./importer.js";
import { DrizzleSeedStore } from "./drizzle-store.js";

async function validate(): Promise<number> {
  const all = await loadAllSeedFiles();
  let failed = false;
  for (const [key, ex] of all) {
    console.log(`${key}: ${ex.records.length} records, ${ex.errors.length} errors, ${ex.warnings.length} warnings`);
    for (const e of ex.errors) {
      console.log(`  ERROR ${e}`);
      failed = true;
    }
    for (const w of ex.warnings) console.log(`  WARN ${w}`);
  }
  const cross = crossValidate(all);
  console.log(`cross-file: ${cross.length} errors`);
  for (const e of cross) {
    console.log(`  ERROR ${e}`);
    failed = true;
  }
  return failed ? 1 : 0;
}

async function runImport(only?: string): Promise<number> {
  const store = new DrizzleSeedStore();
  const keys = only ? [only] : SEED_KEYS;
  let failed = false;
  for (const key of keys) {
    const ex = await loadSeedFile(key);
    const report = await importSeed(store, key, ex.seedVersion, ex.records, ex.errors, "cli", ex.warnings);
    console.log(
      `${key}: ${report.status} — added ${report.counts.added}, updated ${report.counts.updated}, ` +
        `unchanged ${report.counts.unchanged}, conflicted ${report.counts.conflicted}, skipped ${report.counts.skipped}`,
    );
    if (report.status === "failed") failed = true;
  }
  return failed ? 1 : 0;
}

const [command, arg] = process.argv.slice(2);
const run = command === "validate" ? validate() : command === "import" ? runImport(arg) : null;
if (!run) {
  console.error("usage: cli.ts validate | import [seedKey]");
  process.exit(2);
}
run
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

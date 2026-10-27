/**
 * Runs pending migrations. pgvector is enabled first (A2: embedding
 * vectors live in the main database); the extension ships with the
 * pgvector/pgvector image in docker-compose.yml.
 */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1 });
  try {
    await client`CREATE EXTENSION IF NOT EXISTS vector`;
    const db = drizzle(client);
    const folder = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../drizzle",
    );
    await migrate(db, { migrationsFolder: folder });
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop()!);
if (isMain) {
  runMigrations()
    .then(() => console.log("migrations applied"))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

let cached: PostgresJsDatabase<typeof schema> | undefined;

/** Lazy singleton — importing this module never opens a connection. */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const client = postgres(url, { max: 5 });
    cached = drizzle(client, { schema });
  }
  return cached;
}

export * as schema from "./schema.js";

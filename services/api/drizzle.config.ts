import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts", "./src/db/platform-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://scriptwriter:scriptwriter@localhost:5432/scriptwriter",
  },
});

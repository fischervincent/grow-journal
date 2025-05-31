import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/postgres-drizzle/schema/*",
  out: "./generated-drizzle-sql-migrations",
  dbCredentials: {
    url: process.env.POSTGRESQL_DATABASE_URL!,
  }
});

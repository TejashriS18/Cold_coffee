import { defineConfig } from "prisma/config";

// Read DATABASE_URL from environment or fallback to local embedded postgres
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:54329/frostbean?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },

});

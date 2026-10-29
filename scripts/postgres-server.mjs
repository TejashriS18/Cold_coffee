import EmbeddedPostgres from "embedded-postgres";
import path from "path";
import fs from "fs";

const DB_DIR = path.resolve("./.postgres-data");
const PORT = parseInt(process.env.PGPORT || "54329", 10);
const USER = process.env.PGUSER || "postgres";
const PASSWORD = process.env.PGPASSWORD || "postgrespassword";
const DBNAME = process.env.PGDATABASE || "frostbean";

export async function getPostgresInstance() {
  return new EmbeddedPostgres({
    databaseDir: DB_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });
}

const command = process.argv[2] || "start";

async function main() {
  const pg = await getPostgresInstance();

  if (command === "start") {
    console.log(`[PostgreSQL] Initializing cluster at ${DB_DIR}...`);
    try {
      if (!fs.existsSync(DB_DIR)) {
        await pg.initialise();
      }
    } catch (e) {
      // Cluster may already be initialized
    }

    try {
      console.log(`[PostgreSQL] Starting on port ${PORT}...`);
      await pg.start();
      console.log(`[PostgreSQL] Server started successfully on port ${PORT}.`);

      // Ensure database exists
      try {
        await pg.createDatabase(DBNAME);
        console.log(`[PostgreSQL] Database '${DBNAME}' ready.`);
      } catch (err) {
        // If it already exists, ignore
      }

      console.log(`[PostgreSQL] Ready. Connection URL: postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DBNAME}?schema=public`);

      // Keep running if called directly
      const keepAlive = process.argv.includes("--daemon") || !process.argv[2];
      if (keepAlive) {
        console.log("[PostgreSQL] Running in background. Press Ctrl+C to stop.");
        process.on("SIGINT", async () => {
          console.log("[PostgreSQL] Shutting down...");
          await pg.stop();
          process.exit(0);
        });
        process.on("SIGTERM", async () => {
          await pg.stop();
          process.exit(0);
        });
        // Keep node event loop active
        setInterval(() => {}, 1000 * 60 * 60);
      }
    } catch (err) {
      if (err.message && err.message.includes("already running")) {
        console.log(`[PostgreSQL] Server is already running on port ${PORT}.`);
      } else {
        console.error("[PostgreSQL] Failed to start:", err);
        process.exit(1);
      }
    }
  } else if (command === "stop") {
    console.log("[PostgreSQL] Stopping PostgreSQL...");
    try {
      await pg.stop();
      console.log("[PostgreSQL] Stopped.");
    } catch (err) {
      console.log("[PostgreSQL] Server was not running or stopped with message:", err.message);
    }
  }
}

import { fileURLToPath } from "url";

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}


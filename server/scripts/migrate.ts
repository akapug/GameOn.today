import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { log } from "../vite";
import { getMigrationDb } from "../services/database";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to run migrations");
  }

  log("Starting database migrations...");

  try {
    const db = getMigrationDb();
    await migrate(db, { migrationsFolder: "./migrations" });
    log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    log(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

runMigrations();
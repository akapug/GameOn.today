import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";
import { log } from "../vite";

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to run migrations");
  }

  log("Starting database migrations...");

  const db = drizzle({
    connection: process.env.DATABASE_URL,
    ws: ws,
  });

  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    log(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

runMigrations();

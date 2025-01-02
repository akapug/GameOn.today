// This file is being deprecated in favor of db/index.ts
// Importing and re-exporting from db/index.ts for backward compatibility
import { getDb, resetDb } from "@db";
export { getDb, resetDb };

// Migration-specific database instance if needed
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

export const getMigrationDb = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to run migrations");
  }

  return drizzle({
    connection: process.env.DATABASE_URL,
    schema,
    ws: ws,
  });
};
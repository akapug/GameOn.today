import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

// Get or create database connection without migrations
export function getDb() {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }

    dbInstance = drizzle({
      connection: process.env.DATABASE_URL,
      schema,
      ws: ws,
    });
  }
  return dbInstance;
}

// Reset database connection if needed
export function resetDb() {
  dbInstance = null;
}

// Export schema types
export type * from "@db/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

// Only create connection when explicitly called, with no migrations
export function createDbConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  // Create connection without running migrations
  return drizzle({
    connection: process.env.DATABASE_URL,
    schema,
    ws: ws,
  });
}

// Lazy database initialization without migrations
export function getDb() {
  if (!dbInstance) {
    dbInstance = createDbConnection();
  }
  return dbInstance;
}

// Reset database connection if needed
export function resetDb() {
  dbInstance = null;
}

// Export schema types but not the actual schema to prevent early initialization
export type * from "@db/schema";

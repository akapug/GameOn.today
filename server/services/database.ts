import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "@db/schema";

// Get a database instance configured for migrations
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

// Initialize database connection with retries and backoff
export const initializeDatabase = async (maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const db = getMigrationDb();
      // Test the connection with a simple query
      await db.execute(sql`SELECT 1`);
      return db;
    } catch (error) {
      lastError = error;
      console.error(`Database connection attempt ${i + 1} failed:`, error);

      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Double the delay for next retry
      }
    }
  }

  throw lastError;
};

// Re-export the main db connection functions with better error handling
export { getDb, resetDb } from "@db";
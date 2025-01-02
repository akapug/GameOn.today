import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";
import { log } from "../vite";
import { createDbConnection } from "@db";

let dbInstance: ReturnType<typeof createDbConnection> | null = null;

export const initializeDatabase = async () => {
  try {
    if (dbInstance) {
      return dbInstance;
    }

    log("Attempting database connection...");
    dbInstance = createDbConnection();

    // Simple connection test
    await dbInstance.query.users.findFirst();
    log("Database connection established successfully");
    return dbInstance;
  } catch (error) {
    log(`Database initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    dbInstance = null;
    return null;
  }
};

// Export a function to get the database instance
export const getDb = () => {
  if (!dbInstance) {
    dbInstance = createDbConnection();
  }
  return dbInstance;
};

// Add a function to check database connection status
export const isDatabaseConnected = () => {
  return dbInstance !== null;
};
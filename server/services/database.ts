import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";
import { log } from "../vite";
import { createDbConnection } from "@db";

// Single database instance
let dbInstance: ReturnType<typeof createDbConnection> | null = null;

// Get or create database connection without any migrations
export const getDb = () => {
  if (!dbInstance) {
    try {
      log("Initializing database connection...");
      dbInstance = createDbConnection();
      log("Database connection initialized successfully");
    } catch (error) {
      log(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  return dbInstance;
};

// Close database connection if needed
export const closeDb = () => {
  if (dbInstance) {
    log("Closing database connection");
    dbInstance = null;
  }
};

// Separate migration database instance
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
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";
import { log } from "../vite";
import { createDbConnection } from "@db";

// Single database instance
let dbInstance: ReturnType<typeof createDbConnection> | null = null;

// Get or create database connection
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

// Check if database is connected
export const isDatabaseConnected = () => {
  try {
    if (!dbInstance) {
      return false;
    }
    // Don't actually test the connection, just check if we have an instance
    return true;
  } catch (error) {
    log(`Database connection check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Initialize database with connection only
export const initializeDatabase = async () => {
  try {
    if (!dbInstance) {
      log("Initializing database connection...");
      dbInstance = createDbConnection();
      log("Database connection initialized successfully");
    }
    return true;
  } catch (error) {
    log(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

// Close database connection if needed
export const closeDb = () => {
  if (dbInstance) {
    log("Closing database connection");
    dbInstance = null;
  }
};
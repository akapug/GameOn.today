import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let isConnecting = false;
const connectionQueue: Array<(db: ReturnType<typeof drizzle>) => void> = [];

// Get or create database connection without migrations
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (isConnecting) {
    // Return a promise that resolves when the connection is ready
    return new Promise((resolve) => {
      connectionQueue.push(resolve);
    });
  }

  isConnecting = true;
  try {
    dbInstance = drizzle({
      connection: process.env.DATABASE_URL,
      schema,
      ws: ws,
    });

    // Resolve any pending connection requests
    while (connectionQueue.length > 0) {
      const resolve = connectionQueue.shift();
      if (resolve) resolve(dbInstance);
    }

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    isConnecting = false;
    throw error;
  }
}

// Reset database connection if needed
export function resetDb() {
  dbInstance = null;
  isConnecting = false;
  connectionQueue.length = 0;
}

// Export schema types
export type * from "@db/schema";
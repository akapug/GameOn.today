import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

// Export a function to create the database connection
export function createDbConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }

  return drizzle({
    connection: process.env.DATABASE_URL,
    schema,
    ws: ws,
  });
}

// Export the schema for use in other files
export * from "@db/schema";
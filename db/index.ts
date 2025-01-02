import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const getDb = () => {
  const maxRetries = 3;
  let currentTry = 0;

  const connect = async () => {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
      }
      
      console.log("Attempting database connection...");
      const client = drizzle({
        connection: process.env.DATABASE_URL,
        schema,
        ws: ws,
      });
      
      // Test the connection
      await client.select().from(schema.sports).limit(1);
      console.log("Database connection successful");
      return client;
    } catch (error: any) {
      console.error("Database connection error:", error.message);
      if (currentTry < maxRetries) {
        currentTry++;
        console.log(`Retrying database connection (attempt ${currentTry}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * currentTry));
        return await connect();
      }
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  };

  return connect();
};

export const db = await getDb();

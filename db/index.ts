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
      return drizzle({
        connection: process.env.DATABASE_URL,
        schema,
        ws: ws,
      });
    } catch (error) {
      if (currentTry < maxRetries) {
        currentTry++;
        console.log(`Retrying database connection (attempt ${currentTry}/${maxRetries})...`);
        return await connect();
      }
      throw error;
    }
  };

  return connect();
};

export const db = await getDb();

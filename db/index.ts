import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const getDb = () => {
  const maxRetries = 5;
  let currentTry = 0;

  const connect = async () => {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
      }
      
      console.log("Attempting database connection...");
      // Use connection pooling URL
      const poolUrl = process.env.DATABASE_URL.replace('.aws-eu-central-1', '-pooler.aws-eu-central-1')
                                            .replace('.aws-eu-west-1', '-pooler.aws-eu-west-1')
                                            .replace('.aws-us-east-1', '-pooler.aws-us-east-1')
                                            .replace('.aws-us-west-2', '-pooler.aws-us-west-2');
      
      const client = drizzle({
        connection: poolUrl,
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
        const delay = Math.min(1000 * Math.pow(2, currentTry), 10000); // Exponential backoff
        console.log(`Retrying database connection (attempt ${currentTry}/${maxRetries}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return await connect();
      }
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  };

  return connect();
};

export const db = await getDb();

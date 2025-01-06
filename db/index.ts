import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from '@neondatabase/serverless';
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "@db/schema";

// Environment-specific database URLs
const getDatabaseUrl = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    if (!process.env.PROD_DATABASE_URL) {
      throw new Error("PROD_DATABASE_URL must be set for production environment");
    }
    return process.env.PROD_DATABASE_URL;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for development environment");
  }
  return process.env.DATABASE_URL;
};

const getDb = () => {
  const maxRetries = 5;
  let currentTry = 0;

  const connect = async () => {
    try {
      const databaseUrl = getDatabaseUrl();
      const env = process.env.NODE_ENV || 'development';

      console.log(`Attempting database connection for ${env} environment...`);
      // Use connection pooling URL
      const poolUrl = databaseUrl.replace('.aws-eu-central-1', '-pooler.aws-eu-central-1')
                                .replace('.aws-eu-west-1', '-pooler.aws-eu-west-1')
                                .replace('.aws-us-east-1', '-pooler.aws-us-east-1')
                                .replace('.aws-us-west-2', '-pooler.aws-us-west-2');

      const client = drizzle({
        connection: poolUrl,
        schema,
        ws: ws,
        connectionOptions: {
          transformValues: {
            boolean: (val: unknown) => val === true || val === 'true' || val === 't',
          },
        },
      });

      // Test the connection
      const testQuery = await client.execute(sql`SELECT NOW()`);
      console.log(`${env} database connection test successful:`, testQuery.rows[0]);
      return client;
    } catch (error: any) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('endpoint is disabled') || errorMsg.includes('paused')) {
        console.error("Database connection error: Database appears to be paused. This may be due to billing issues or inactivity.");
        throw new Error("Database is paused - please check your database status and billing information");
      }

      console.error("Database connection error:", error.message);
      if (currentTry < maxRetries) {
        currentTry++;
        const delay = Math.min(1000 * Math.pow(2, currentTry), 10000); // Exponential backoff
        console.log(`Retrying connection (attempt ${currentTry}/${maxRetries}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return await connect();
      }
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  };

  return connect();
};

export const db = await getDb();
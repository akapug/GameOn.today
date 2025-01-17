import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "@db/schema";

// Environment-specific database URLs
const getDatabaseUrl = () => {
  const env = process.env.NODE_ENV || 'development';
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  return process.env.DATABASE_URL;
};

const getDb = () => {
  const maxRetries = 5;
  let currentTry = 0;

  const connect = async () => {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    while (currentTry < maxRetries) {
      try {
        const databaseUrl = process.env.DATABASE_URL;
        const env = process.env.NODE_ENV || 'development';
      const schemaName = env === 'production' ? 'production' : 'development';

      console.log(`Attempting database connection for ${env} environment using ${schemaName} schema...`);

      // Create the Drizzle client
      const client = drizzle({
        connection: databaseUrl,
        schema,
        ws: ws,
      });

      // Set schema explicitly before any operations
      await client.execute(sql`SET search_path TO ${sql.identifier(schemaName)}`);
      console.log(`Set database search_path to schema: ${schemaName}`);

      // Verify schema exists and is accessible
      const schemaTest = await client.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.schemata 
          WHERE schema_name = ${schemaName}
        );
      `);

      if (!schemaTest.rows[0].exists) {
        throw new Error(`Schema '${schemaName}' does not exist`);
      }

      // Add environment-specific logging
      if (env === 'development') {
        console.log('DEVELOPMENT MODE: Using development schema');
      } else {
        console.log('PRODUCTION MODE: Using production schema');
      }

      return client;
    } catch (error: any) {
      console.error(`Database connection error (${process.env.NODE_ENV}):`, error.message);

      if (currentTry < maxRetries) {
        currentTry++;
        const delay = Math.min(1000 * Math.pow(2, currentTry), 10000);
        console.log(`Retrying connection (attempt ${currentTry}/${maxRetries}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return await connect();
      }
      throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
    }
  };

  return connect();
};

const dbPromise = (async () => {
  try {
    return await getDb();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
})();

export const db = await dbPromise;

// Add a safety check function for development-only operations
export const ensureDevEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This operation is not allowed in production environment');
  }
};

// Function to sync development schema with production structure (without data)
export const syncDevelopmentSchema = async () => {
  ensureDevEnvironment();

  try {
    console.log('Starting development schema sync...');

    await db.execute(sql`
      -- Create fresh development schema
      CREATE SCHEMA IF NOT EXISTS development;

      -- Recreate tables in development schema
      CREATE TABLE IF NOT EXISTS development.activities (LIKE production.activities INCLUDING ALL);
      CREATE TABLE IF NOT EXISTS development.games (LIKE production.games INCLUDING ALL);
      CREATE TABLE IF NOT EXISTS development.players (LIKE production.players INCLUDING ALL);
    `);

    console.log('Development schema sync completed successfully');
  } catch (error) {
    console.error('Error syncing development schema:', error);
    throw error;
  }
};
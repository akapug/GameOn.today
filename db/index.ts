import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from '@neondatabase/serverless';
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
    try {
      const databaseUrl = getDatabaseUrl();
      const env = process.env.NODE_ENV || 'development';
      const schemaName = env === 'production' ? 'production' : 'development';

      console.log(`Attempting database connection for ${env} environment using ${schemaName} schema...`);

      // Create initial raw SQL client to set search path
      const sqlClient = neon(databaseUrl);
      await sqlClient`SET search_path TO ${sqlClient.raw(schemaName)}, public`;

      // Create the Drizzle client with schema-aware configuration
      const client = drizzle({
        connection: databaseUrl,
        schema,
        ws: ws,
        connectionOptions: {
          transformValues: {
            boolean: (val: unknown) => val === true || val === 'true' || val === 't',
          },
        },
      });

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

      // Verify search path is set correctly
      const searchPath = await client.execute(sql`SHOW search_path`);
      console.log(`Current search path: ${searchPath.rows[0].search_path}`);

      // Add environment-specific logging
      if (env === 'development') {
        console.log('DEVELOPMENT MODE: Using development schema with sample data');
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

export const db = await getDb();

// Add a safety check function for development-only operations
export const ensureDevEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This operation is not allowed in production environment');
  }
};

// Function to sync development schema with production data
export const syncDevelopmentSchema = async () => {
  ensureDevEnvironment();

  try {
    console.log('Starting development schema sync...');

    // Copy schema structure and data from production to development
    await db.execute(sql`
      -- Drop existing development schema
      DROP SCHEMA IF EXISTS development CASCADE;

      -- Create fresh development schema
      CREATE SCHEMA development;

      -- Copy schema structure from production
      CREATE TABLE development.activities (LIKE production.activities INCLUDING ALL);
      CREATE TABLE development.games (LIKE production.games INCLUDING ALL);
      CREATE TABLE development.players (LIKE production.players INCLUDING ALL);

      -- Copy initial data for development
      INSERT INTO development.activities SELECT * FROM production.activities;
      INSERT INTO development.games SELECT * FROM production.games;
      INSERT INTO development.players SELECT * FROM production.players;

    `);

    console.log('Development schema sync completed successfully');
  } catch (error) {
    console.error('Error syncing development schema:', error);
    throw error;
  }
};
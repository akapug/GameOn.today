import { db } from "@db";
import { sql } from "drizzle-orm";

async function main() {
  console.log('Setting up database schemas...');

  try {
    // Create schemas if they don't exist
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS production;
      CREATE SCHEMA IF NOT EXISTS development;
    `);

    // Move existing tables to production schema if they're in public
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('activities', 'games', 'players')
        ) THEN
          ALTER TABLE IF EXISTS public.activities SET SCHEMA production;
          ALTER TABLE IF EXISTS public.games SET SCHEMA production;
          ALTER TABLE IF EXISTS public.players SET SCHEMA production;
        END IF;
      END $$;
    `);

    // Initial sync of development schema
    await db.execute(sql`
      -- Create tables in development schema
      CREATE TABLE IF NOT EXISTS development.activities (LIKE production.activities INCLUDING ALL);
      CREATE TABLE IF NOT EXISTS development.games (LIKE production.games INCLUDING ALL);
      CREATE TABLE IF NOT EXISTS development.players (LIKE production.players INCLUDING ALL);

      -- Copy initial data
      INSERT INTO development.activities 
      SELECT * FROM production.activities 
      ON CONFLICT DO NOTHING;
    `);

    console.log('Schema setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up schemas:', error);
    process.exit(1);
  }
}

main().catch(console.error);

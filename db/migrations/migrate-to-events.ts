import { db } from "@db";
import { sql } from "drizzle-orm";

async function tableExists(schema: string, tableName: string) {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = ${schema}
      AND table_name = ${tableName}
    );
  `);
  return result.rows[0].exists;
}

async function migrateSchema(schema: string) {
  console.log(`Migrating ${schema} schema...`);

  try {
    // Step 1: Create new tables (they will be our final tables if no migration needed)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(schema)}.event_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        icon TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ${sql.identifier(schema)}.events (
        id SERIAL PRIMARY KEY,
        url_hash TEXT NOT NULL UNIQUE,
        is_private BOOLEAN NOT NULL DEFAULT false,
        event_type_id INTEGER,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        participant_threshold INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        creator_id TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        timezone TEXT NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        web_link TEXT,
        is_recurring BOOLEAN NOT NULL DEFAULT false,
        recurrence_frequency TEXT,
        parent_event_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS ${sql.identifier(schema)}.participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        response_token TEXT,
        likelihood DECIMAL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        comment TEXT
      );
    `);

    // Step 2: Check if we need to migrate data from old tables
    const hasActivities = await tableExists(schema, 'activities');
    const hasGames = await tableExists(schema, 'games');
    const hasPlayers = await tableExists(schema, 'players');

    if (hasActivities || hasGames || hasPlayers) {
      console.log(`Found legacy tables in ${schema}, performing data migration...`);

      if (hasActivities) {
        await db.execute(sql`
          INSERT INTO ${sql.identifier(schema)}.event_types (id, name, color, icon)
          SELECT id, name, color, icon
          FROM ${sql.identifier(schema)}.activities
          ON CONFLICT (name) DO NOTHING;
        `);
      }

      if (hasGames) {
        await db.execute(sql`
          INSERT INTO ${sql.identifier(schema)}.events (
            id, url_hash, is_private, event_type_id, title, location,
            date, participant_threshold, created_at, creator_id,
            creator_name, timezone, end_time, notes, web_link,
            is_recurring, recurrence_frequency, parent_event_id
          )
          SELECT 
            id, url_hash, is_private, activity_id, title, location,
            date, player_threshold, created_at, creator_id,
            creator_name, timezone, end_time, notes, web_link,
            is_recurring, recurrence_frequency, parent_game_id
          FROM ${sql.identifier(schema)}.games
          ON CONFLICT (url_hash) DO NOTHING;
        `);
      }

      if (hasPlayers) {
        await db.execute(sql`
          INSERT INTO ${sql.identifier(schema)}.participants (
            id, event_id, name, email, phone, response_token,
            likelihood, created_at, comment
          )
          SELECT 
            id, game_id, name, email, phone, response_token,
            likelihood, created_at, comment
          FROM ${sql.identifier(schema)}.players;
        `);
      }

      // Step 3: Drop old tables after successful migration
      if (hasPlayers) {
        await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(schema)}.players;`);
      }
      if (hasGames) {
        await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(schema)}.games;`);
      }
      if (hasActivities) {
        await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(schema)}.activities;`);
      }
    } else {
      console.log(`No legacy tables found in ${schema}, creating fresh event system tables.`);
    }

    // Step 4: Add foreign key constraints
    await db.execute(sql`
      ALTER TABLE ${sql.identifier(schema)}.events 
      ADD CONSTRAINT events_event_type_id_fkey 
      FOREIGN KEY (event_type_id) REFERENCES ${sql.identifier(schema)}.event_types(id);

      ALTER TABLE ${sql.identifier(schema)}.events 
      ADD CONSTRAINT events_parent_event_id_fkey 
      FOREIGN KEY (parent_event_id) REFERENCES ${sql.identifier(schema)}.events(id);

      ALTER TABLE ${sql.identifier(schema)}.participants 
      ADD CONSTRAINT participants_event_id_fkey 
      FOREIGN KEY (event_id) REFERENCES ${sql.identifier(schema)}.events(id);
    `);

    console.log(`Successfully migrated ${schema} schema`);
  } catch (error) {
    console.error(`Error migrating ${schema} schema:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Migrate both development and production schemas
    await migrateSchema('development');

    // Only migrate production if we're in production environment
    if (process.env.NODE_ENV === 'production') {
      await migrateSchema('production');
    }

    console.log('Migration complete: Converted games/activities to events/event-types');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
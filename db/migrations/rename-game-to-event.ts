import { db } from "@db";
import { sql } from "drizzle-orm";

async function migrateSchema(schemaName: string) {
  console.log(`Starting migration for schema: ${schemaName}`);

  try {
    // Set the search path to the correct schema
    await db.execute(sql`SET search_path TO ${sql.raw(schemaName)}`);

    // Step 1: Rename activities to event_types
    await db.execute(sql`
      ALTER TABLE activities 
      RENAME TO event_types;
    `);

    await db.execute(sql`
      ALTER INDEX activities_name_idx
      RENAME TO event_types_name_idx;
    `);

    // Step 2: Rename games to events and update references
    await db.execute(sql`
      ALTER TABLE games 
      RENAME TO events;
    `);

    await db.execute(sql`
      ALTER TABLE events 
      RENAME COLUMN activity_id TO event_type_id;
    `);

    await db.execute(sql`
      ALTER TABLE events 
      RENAME COLUMN player_threshold TO participant_threshold;
    `);

    await db.execute(sql`
      ALTER TABLE events 
      RENAME COLUMN parent_game_id TO parent_event_id;
    `);

    // Step 3: Rename players to participants and update references
    await db.execute(sql`
      ALTER TABLE players 
      RENAME TO participants;
    `);

    await db.execute(sql`
      ALTER TABLE participants 
      RENAME COLUMN game_id TO event_id;
    `);

    console.log(`Migration completed successfully for schema: ${schemaName}`);
  } catch (error) {
    console.error(`Migration failed for schema ${schemaName}:`, error);
    throw error;
  }
}

async function main() {
  console.log('Starting migration: Renaming game-specific schema to event-based schema...');

  try {
    // Migrate both schemas
    await migrateSchema('development');
    await migrateSchema('production');

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
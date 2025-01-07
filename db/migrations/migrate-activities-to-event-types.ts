
import { db } from "@db";
import { sql } from "drizzle-orm";

async function main() {
  console.log('Starting migration from activities to event_types...');

  try {
    // First ensure the activities table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL
      );
    `);

    // Check if we need to migrate
    const hasEventTypes = await db.execute(
      sql`SELECT EXISTS (SELECT 1 FROM event_types LIMIT 1);`
    );
    
    const hasActivities = await db.execute(
      sql`SELECT EXISTS (SELECT 1 FROM activities LIMIT 1);`
    );

    const needsMigration = hasActivities.rows[0].exists && !hasEventTypes.rows[0].exists;

    if (needsMigration) {
      console.log('Migrating data from activities to event_types...');
      
      // Copy data from activities to event_types
      await db.execute(sql`
        INSERT INTO event_types (name, color, icon)
        SELECT name, color, icon
        FROM activities
        ON CONFLICT (name) DO NOTHING;
      `);

      // Update foreign key references in events table
      await db.execute(sql`
        UPDATE events e
        SET event_type_id = (
          SELECT et.id 
          FROM event_types et
          JOIN activities a ON a.name = et.name
          WHERE a.id = e.event_type_id
        );
      `);

      console.log('Migration completed successfully');
    } else {
      console.log('No migration needed - event_types table already has data or activities table is empty');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

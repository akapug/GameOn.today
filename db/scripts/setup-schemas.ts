import { db } from "@db";
import { sql } from "drizzle-orm";

async function main() {
  console.log('Setting up database schemas...');
  const schema = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  try {
    await Promise.race([
      db.execute(sql`SET search_path TO ${sql.identifier(schema)}, public`),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    console.log(`Set search path to ${schema} schema`);
  } catch (error) {
    console.error('Failed to set schema:', error);
    process.exit(1);
  }

  console.log(`${schema.toUpperCase()} MODE: Using ${schema} schema`);

  try {
    // Create schemas if they don't exist
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schema)}`);

    // Create event_types table first (replaces activities)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(schema)}.event_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL
      )`);

    // Create unique constraint on name if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'event_types_name_key'
        ) THEN
          ALTER TABLE ${sql.identifier(schema)}.event_types 
          ADD CONSTRAINT event_types_name_key UNIQUE (name);
        END IF;
      END $$;
    `);

    // Create events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(schema)}.events (
        id SERIAL PRIMARY KEY,
        url_hash TEXT NOT NULL UNIQUE,
        is_private BOOLEAN NOT NULL DEFAULT false,
        event_type_id INTEGER REFERENCES ${sql.identifier(schema)}.event_types(id),
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
        parent_event_id INTEGER REFERENCES ${sql.identifier(schema)}.events(id)
      )`);

    // Create participants table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(schema)}.participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES ${sql.identifier(schema)}.events(id),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        likelihood DECIMAL NOT NULL DEFAULT 1,
        response_token TEXT NOT NULL,
        comment TEXT
      )`);

    // Insert default event types if none exist
    const defaultEventTypes = [
      { name: 'Basketball', color: '#FF6B6B', icon: '🏀' },
      { name: 'Soccer', color: '#4ECDC4', icon: '⚽' },
      { name: 'Tennis', color: '#45B7D1', icon: '🎾' },
      { name: 'Volleyball', color: '#96CEB4', icon: '🏐' }
    ];

    for (const eventType of defaultEventTypes) {
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schema)}.event_types (name, color, icon)
        VALUES (${eventType.name}, ${eventType.color}, ${eventType.icon})
        ON CONFLICT (name) DO NOTHING`);
    }

    console.log('Schema setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up schemas:', error);
    process.exit(1);
  }
}

main().catch(console.error);
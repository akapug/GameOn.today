import { db } from "@db";
import { sql } from "drizzle-orm";

async function main() {
  console.log('Setting up database schemas...');

  try {
    // Create schemas first
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS production`);
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS development`);

    // Create event_types table first (replaces activities)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS production.event_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL
      )`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS development.event_types (
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
          ALTER TABLE production.event_types 
          ADD CONSTRAINT event_types_name_key UNIQUE (name);

          ALTER TABLE development.event_types 
          ADD CONSTRAINT event_types_name_key UNIQUE (name);
        END IF;
      END $$;
    `);

    // Create events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS production.events (
        id SERIAL PRIMARY KEY,
        url_hash TEXT NOT NULL UNIQUE,
        is_private BOOLEAN NOT NULL DEFAULT false,
        event_type_id INTEGER REFERENCES production.event_types(id),
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
        parent_event_id INTEGER REFERENCES production.events(id)
      )`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS development.events (
        id SERIAL PRIMARY KEY,
        url_hash TEXT NOT NULL UNIQUE,
        is_private BOOLEAN NOT NULL DEFAULT false,
        event_type_id INTEGER REFERENCES development.event_types(id),
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
        parent_event_id INTEGER REFERENCES development.events(id)
      )`);

    // Create participants table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS production.participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES production.events(id),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        likelihood DECIMAL NOT NULL DEFAULT 1,
        response_token TEXT NOT NULL,
        comment TEXT
      )`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS development.participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES development.events(id),
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
      // First ensure schemas exist
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS production`);
      await db.execute(sql`CREATE SCHEMA IF NOT EXISTS development`);
      
      // Then create event_types tables if they don't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS production.event_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL,
          icon TEXT NOT NULL
        )`);
        
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS development.event_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL,
          icon TEXT NOT NULL
        )`);

      // Insert the data
      await db.execute(sql`
        INSERT INTO production.event_types (name, color, icon)
        VALUES (${eventType.name}, ${eventType.color}, ${eventType.icon})
        ON CONFLICT (name) DO NOTHING`);

      await db.execute(sql`
        INSERT INTO development.event_types (name, color, icon)
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
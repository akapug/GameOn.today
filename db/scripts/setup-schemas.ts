
import { db } from "@db";
import { sql } from "drizzle-orm";

async function main() {
  console.log('Setting up database schemas...');

  try {
    // Create schemas first
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS production`);
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS development`);

    // Create production tables first
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS production.activities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL
      )`);

    await db.execute(sql`
      ALTER TABLE production.activities 
      ADD CONSTRAINT activities_name_key UNIQUE (name)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS production.games (
        id SERIAL PRIMARY KEY,
        url_hash TEXT NOT NULL UNIQUE,
        is_private BOOLEAN NOT NULL DEFAULT false,
        activity_id INTEGER REFERENCES production.activities(id),
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        player_threshold INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        creator_id TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        timezone TEXT NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        web_link TEXT,
        is_recurring BOOLEAN NOT NULL DEFAULT false,
        recurrence_frequency TEXT,
        parent_game_id INTEGER REFERENCES production.games(id)
      )`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS production.players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES production.games(id),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        likelihood DECIMAL NOT NULL DEFAULT 1,
        response_token TEXT NOT NULL,
        comment TEXT
      )`);

    // Create development tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS development.activities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL
      )`);

    await db.execute(sql`
      ALTER TABLE development.activities 
      ADD CONSTRAINT activities_name_key UNIQUE (name)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS development.games (
        id SERIAL PRIMARY KEY,
        url_hash TEXT NOT NULL UNIQUE,
        is_private BOOLEAN NOT NULL DEFAULT false,
        activity_id INTEGER REFERENCES development.activities(id),
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        player_threshold INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        creator_id TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        timezone TEXT NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        web_link TEXT,
        is_recurring BOOLEAN NOT NULL DEFAULT false,
        recurrence_frequency TEXT,
        parent_game_id INTEGER REFERENCES development.games(id)
      )`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS development.players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES development.games(id),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        likelihood DECIMAL NOT NULL DEFAULT 1,
        response_token TEXT NOT NULL,
        comment TEXT
      )`);

    // Insert default activities
    const defaultActivities = [
      { name: 'Basketball', color: '#FF6B6B', icon: '🏀' },
      { name: 'Soccer', color: '#4ECDC4', icon: '⚽' },
      { name: 'Tennis', color: '#45B7D1', icon: '🎾' },
      { name: 'Volleyball', color: '#96CEB4', icon: '🏐' }
    ];

    for (const activity of defaultActivities) {
      await db.execute(sql`
        INSERT INTO production.activities (name, color, icon)
        VALUES (${activity.name}, ${activity.color}, ${activity.icon})
        ON CONFLICT (name) DO NOTHING`);
      
      await db.execute(sql`
        INSERT INTO development.activities (name, color, icon)
        VALUES (${activity.name}, ${activity.color}, ${activity.icon})
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

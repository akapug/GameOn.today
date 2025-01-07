import { db } from "@db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    // Rename activities to event_types if the table exists
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = current_schema()
          AND table_name = 'activities'
        ) THEN
          -- Create event_types if it doesn't exist
          CREATE TABLE IF NOT EXISTS event_types (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL,
            icon TEXT NOT NULL
          );
          
          -- Copy data from activities to event_types
          INSERT INTO event_types (id, name, color, icon)
          SELECT id, name, color, icon
          FROM activities
          ON CONFLICT (name) DO NOTHING;
        END IF;
      END $$;
    `);

    // Rename games to events if the table exists
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = current_schema()
          AND table_name = 'games'
        ) THEN
          -- Create events table with new structure
          CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            url_hash TEXT NOT NULL UNIQUE,
            is_private BOOLEAN NOT NULL DEFAULT false,
            event_type_id INTEGER REFERENCES event_types(id),
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

          -- Copy data from games to events
          INSERT INTO events (
            id, url_hash, is_private, event_type_id, title, location, date,
            participant_threshold, created_at, creator_id, creator_name,
            timezone, end_time, notes, web_link, is_recurring,
            recurrence_frequency, parent_event_id
          )
          SELECT 
            id, url_hash, is_private, activity_id, title, location, date,
            player_threshold, created_at, creator_id, creator_name,
            timezone, end_time, notes, web_link, is_recurring,
            recurrence_frequency, parent_game_id
          FROM games
          ON CONFLICT (url_hash) DO NOTHING;

          -- Update foreign key reference
          ALTER TABLE events 
          ADD CONSTRAINT events_parent_event_id_fkey 
          FOREIGN KEY (parent_event_id) REFERENCES events(id);
        END IF;
      END $$;
    `);

    // Rename players to participants if the table exists
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = current_schema()
          AND table_name = 'players'
        ) THEN
          -- Create participants table
          CREATE TABLE IF NOT EXISTS participants (
            id SERIAL PRIMARY KEY,
            event_id INTEGER REFERENCES events(id),
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            response_token TEXT,
            likelihood DECIMAL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            comment TEXT
          );

          -- Copy data from players to participants
          INSERT INTO participants (
            id, event_id, name, email, phone, response_token,
            likelihood, created_at, comment
          )
          SELECT 
            id, game_id, name, email, phone, response_token,
            likelihood, created_at, comment
          FROM players;
        END IF;
      END $$;
    `);

    console.log('Migration complete: Converted games/activities to events/event-types');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

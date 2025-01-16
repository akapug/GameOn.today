
import { db } from "../index";
import { sql } from "drizzle-orm";
import { eventTypes } from "../schema";

async function main() {
  try {
    console.log('Initializing development environment...');
    
    // Set schema
    await db.execute(sql`SET search_path TO development, public`);
    
    // Ensure unique constraint exists
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'event_types_name_key'
        ) THEN
          ALTER TABLE event_types ADD CONSTRAINT event_types_name_key UNIQUE (name);
        END IF;
      END $$;
    `);
    
    // Insert default event types
    const defaultEventTypes = [
      { name: "Basketball", color: "#FF6B6B", icon: "🏀" },
      { name: "Soccer", color: "#4ECDC4", icon: "⚽" },
      { name: "Tennis", color: "#45B7D1", icon: "🎾" },
      { name: "Volleyball", color: "#96CEB4", icon: "🏐" }
    ];

    for (const eventType of defaultEventTypes) {
      await db.execute(
        sql`INSERT INTO event_types (name, color, icon)
            VALUES (${eventType.name}, ${eventType.color}, ${eventType.icon})
            ON CONFLICT (name) 
            DO UPDATE SET color = EXCLUDED.color, icon = EXCLUDED.icon`
      );
    }

    console.log('Development environment initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize development environment:', error);
    process.exit(1);
  }
}

main().catch(console.error);

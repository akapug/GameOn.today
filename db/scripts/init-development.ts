
import { db } from "../index";
import { sql } from "drizzle-orm";
import { activities } from "../schema";

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
          WHERE conname = 'activities_name_key'
        ) THEN
          ALTER TABLE activities ADD CONSTRAINT activities_name_key UNIQUE (name);
        END IF;
      END $$;
    `);
    
    // Insert default activities
    const defaultActivities = [
      { name: "Basketball", color: "#FF6B6B", icon: "🏀" },
      { name: "Soccer", color: "#4ECDC4", icon: "⚽" },
      { name: "Tennis", color: "#45B7D1", icon: "🎾" },
      { name: "Volleyball", color: "#96CEB4", icon: "🏐" }
    ];

    for (const activity of defaultActivities) {
      await db.execute(
        sql`INSERT INTO activities (name, color, icon)
            VALUES (${activity.name}, ${activity.color}, ${activity.icon})
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

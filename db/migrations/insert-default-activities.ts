
import { db } from "@db";
import { activities } from "@db/schema";
import { sql } from "drizzle-orm";

const defaultActivities = [
  { name: "Basketball", color: "#FF6B6B", icon: "🏀" },
  { name: "Soccer", color: "#4ECDC4", icon: "⚽" },
  { name: "Tennis", color: "#45B7D1", icon: "🎾" },
  { name: "Volleyball", color: "#96CEB4", icon: "🏐" },
  { name: "Baseball", color: "#D4A373", icon: "⚾" },
  { name: "Poker", color: "#E63946", icon: "🃏" },
  { name: "Board Games", color: "#457B9D", icon: "🎲" },
  { name: "Going Out", color: "#2A9D8F", icon: "🎉" },
  { name: "Other", color: "#6C757D", icon: "🎮" }
];

async function main() {
  // Use ON CONFLICT to update existing records
  for (const activity of defaultActivities) {
    await db.execute(
      sql`INSERT INTO activities (name, color, icon)
          VALUES (${activity.name}, ${activity.color}, ${activity.icon})
          ON CONFLICT (name) 
          DO UPDATE SET color = EXCLUDED.color, icon = EXCLUDED.icon`
    );
  }
  console.log('Default activities inserted/updated');
  process.exit(0);
}

main().catch(console.error);

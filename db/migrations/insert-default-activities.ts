
import { db } from "@db";
import { activities } from "@db/schema";
import { sql } from "drizzle-orm";

const defaultActivities = [
  { id: 1, name: "Basketball", color: "#FF6B6B", icon: "🏀" },
  { id: 2, name: "Soccer", color: "#4ECDC4", icon: "⚽" },
  { id: 3, name: "Tennis", color: "#45B7D1", icon: "🎾" },
  { id: 4, name: "Volleyball", color: "#96CEB4", icon: "🏐" },
  { id: 5, name: "Baseball", color: "#D4A373", icon: "⚾" },
  { id: 6, name: "Poker", color: "#E63946", icon: "🃏" },
  { id: 7, name: "Board Games", color: "#457B9D", icon: "🎲" },
  { id: 8, name: "Going Out", color: "#2A9D8F", icon: "🎉" },
  { id: 9, name: "Other", color: "#6C757D", icon: "🎮" },
  { id: 10, name: "Frisbee", color: "#4CAF50", icon: "🥏" },
  { id: 11, name: "Pickleball", color: "#FF9800", icon: "🎾" },
  { id: 12, name: "Golf", color: "#8BC34A", icon: "⛳" }
];

async function main() {
  for (const activity of defaultActivities) {
    await db.execute(
      sql`INSERT INTO activities (id, name, color, icon)
          VALUES (${activity.id}, ${activity.name}, ${activity.color}, ${activity.icon})
          ON CONFLICT (name) DO UPDATE 
          SET color = EXCLUDED.color, 
              icon = EXCLUDED.icon
          WHERE activities.id != EXCLUDED.id`
    );
  }
  console.log('Default activities inserted/updated with preserved IDs');
  process.exit(0);
}

main().catch(console.error);

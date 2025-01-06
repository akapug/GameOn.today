
import { db } from "@db";
import { activities } from "@db/schema";

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
  for (const activity of defaultActivities) {
    await db.insert(activities).values(activity).onConflictDoNothing();
  }
  console.log('Default activities inserted');
  process.exit(0);
}

main().catch(console.error);

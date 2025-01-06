
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // First, update games to use temporary IDs to avoid conflicts
  await db.execute(sql`
    UPDATE games 
    SET activity_id = activity_id + 1000 
    WHERE activity_id IS NOT NULL;
  `);

  // Reset activity IDs to original values
  const activityMapping = [
    { name: 'Basketball', newId: 1 },
    { name: 'Soccer', newId: 2 },
    { name: 'Tennis', newId: 3 },
    { name: 'Volleyball', newId: 4 },
    { name: 'Baseball', newId: 5 },
    { name: 'Poker', newId: 6 },
    { name: 'Board Games', newId: 7 },
    { name: 'Going Out', newId: 8 },
    { name: 'Other', newId: 9 },
    { name: 'Frisbee', newId: 10 },
    { name: 'Pickleball', newId: 11 },
    { name: 'Golf', newId: 12 }
  ];

  for (const mapping of activityMapping) {
    await db.execute(
      sql`UPDATE activities SET id = ${mapping.newId} WHERE name = ${mapping.name}`
    );
  }

  // Update games back to use new activity IDs
  await db.execute(sql`
    UPDATE games 
    SET activity_id = activity_id - 1000 
    WHERE activity_id >= 1000;
  `);

  console.log('Activity IDs reset complete');
  process.exit(0);
}

main().catch(console.error);

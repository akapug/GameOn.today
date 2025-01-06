
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // First, update games to use temporary IDs to avoid conflicts
  await db.execute(sql`
    UPDATE games 
    SET activity_id = activity_id + 1000 
    WHERE activity_id IS NOT NULL;
  `);

  // Delete Baseball activity
  await db.execute(sql`DELETE FROM activities WHERE name = 'Baseball'`);

  // Reset activity IDs to original values
  const activityMapping = [
    { name: 'Basketball', newId: 1 },
    { name: 'Soccer', newId: 2 },
    { name: 'Tennis', newId: 3 },
    { name: 'Volleyball', newId: 4 },
    { name: 'Poker', newId: 5 },
    { name: 'Board Games', newId: 6 },
    { name: 'Going Out', newId: 7 },
    { name: 'Other', newId: 8 },
    { name: 'Frisbee', newId: 9 },
    { name: 'Pickleball', newId: 10 },
    { name: 'Golf', newId: 11 }
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

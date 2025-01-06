
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // First get all current activity mappings
  const currentActivities = await db.execute(sql`
    SELECT id, name FROM activities ORDER BY id;
  `);
  
  // Create a mapping of old to new IDs
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

  // Update each activity one by one
  for (const mapping of activityMapping) {
    await db.execute(
      sql`UPDATE activities SET id = (-${mapping.newId}::integer) WHERE name = ${mapping.name}`
    );
  }

  // Update games to use new activity IDs
  for (const mapping of activityMapping) {
    const oldActivity = currentActivities.rows.find(a => a.name === mapping.name);
    if (oldActivity) {
      await db.execute(
        sql`UPDATE games SET activity_id = (-${mapping.newId}::integer) WHERE activity_id = ${oldActivity.id}`
      );
    }
  }

  // Finally, make IDs positive again
  await db.execute(sql`UPDATE activities SET id = (-id::integer) WHERE id < 0`);
  await db.execute(sql`UPDATE games SET activity_id = (-activity_id::integer) WHERE activity_id < 0`);

  console.log('Activity IDs reset complete');
  process.exit(0);
}

main().catch(console.error);

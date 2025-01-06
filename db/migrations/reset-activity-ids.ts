
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // First get all current activity mappings
  const currentActivities = await db.execute(sql`
    SELECT id, name FROM activities ORDER BY id;
  `);
  
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

  // First update any games with invalid activity IDs to use "Other" (ID 8)
  await db.execute(sql`
    UPDATE games SET activity_id = 8 
    WHERE activity_id NOT IN (SELECT id FROM activities)
  `);

  // Update games with temporary IDs
  for (const mapping of activityMapping) {
    const oldActivity = currentActivities.rows.find(a => a.name === mapping.name);
    if (oldActivity) {
      await db.execute(
        sql`UPDATE games SET activity_id = ${mapping.newId + 1000} 
            WHERE activity_id = ${oldActivity.id}`
      );
    }
  }

  // Temporarily disable foreign key checks
  await db.execute(sql`SET CONSTRAINTS games_activity_id_activities_id_fk DEFERRED`);

  // Update activities
  for (const mapping of activityMapping) {
    await db.execute(
      sql`UPDATE activities SET id = ${mapping.newId} 
          WHERE name = ${mapping.name}`
    );
  }

  // Re-enable foreign key checks
  await db.execute(sql`SET CONSTRAINTS games_activity_id_activities_id_fk IMMEDIATE`);

  // Update games back to final IDs
  for (const mapping of activityMapping) {
    await db.execute(
      sql`UPDATE games SET activity_id = ${mapping.newId} 
          WHERE activity_id = ${mapping.newId + 1000}`
    );
  }

  console.log('Activity IDs reset complete');
  process.exit(0);
}

main().catch(console.error);

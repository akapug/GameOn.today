
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

  // First create temporary activities with new IDs
  for (const mapping of activityMapping) {
    const oldActivity = currentActivities.rows.find(a => a.name === mapping.name);
    if (oldActivity) {
      await db.execute(sql`
        INSERT INTO activities (id, name, color, icon)
        SELECT ${mapping.newId + 1000}, name, color, icon
        FROM activities
        WHERE name = ${mapping.name}
      `);
    }
  }

  // Update games to use temporary activity IDs
  for (const mapping of activityMapping) {
    const oldActivity = currentActivities.rows.find(a => a.name === mapping.name);
    if (oldActivity) {
      await db.execute(sql`
        UPDATE games 
        SET activity_id = ${mapping.newId + 1000}
        WHERE activity_id = ${oldActivity.id}
      `);
    }
  }

  // Delete old activities
  await db.execute(sql`
    DELETE FROM activities 
    WHERE id NOT IN (${sql.join(activityMapping.map(m => m.newId + 1000))})
  `);

  // Update temporary activities to final IDs
  for (const mapping of activityMapping) {
    await db.execute(sql`
      UPDATE activities 
      SET id = ${mapping.newId}
      WHERE id = ${mapping.newId + 1000}
    `);
  }

  // Update games to use final activity IDs
  for (const mapping of activityMapping) {
    await db.execute(sql`
      UPDATE games 
      SET activity_id = ${mapping.newId}
      WHERE activity_id = ${mapping.newId + 1000}
    `);
  }

  console.log('Activity IDs reset complete');
  process.exit(0);
}

main().catch(console.error);

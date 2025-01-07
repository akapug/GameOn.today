
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // First drop foreign key constraints
  await db.execute(sql`
    ALTER TABLE games DROP CONSTRAINT IF EXISTS games_activity_id_activities_id_fk;
  `);

  const activityOrder = [
    { oldId: 9, name: "Frisbee" },
    { oldId: 2, name: "Basketball" },
    { oldId: 3, name: "Soccer" },
    { oldId: 4, name: "Volleyball" },
    { oldId: 5, name: "Poker" },
    { oldId: 6, name: "Board Games" },
    { oldId: 7, name: "Going Out" },
    { oldId: 8, name: "Tennis" },
    { oldId: 10, name: "Pickleball" },
    { oldId: 11, name: "Golf" },
    { oldId: 8, name: "Other" }
  ];

  // Update each activity and related games
  for (let i = 0; i < activityOrder.length; i++) {
    const newId = i + 1;
    const { oldId, name } = activityOrder[i];
    
    // Use temporary ID to avoid conflicts
    const tempId = oldId + 1000;
    
    // Update games to use temp ID
    await db.execute(sql`
      UPDATE games SET activity_id = ${tempId}
      WHERE activity_id = ${oldId}
    `);
    
    // Update activity ID
    await db.execute(sql`
      UPDATE activities SET id = ${newId}
      WHERE id = ${oldId} AND name = ${name}
    `);
    
    // Update games to use final ID
    await db.execute(sql`
      UPDATE games SET activity_id = ${newId}
      WHERE activity_id = ${tempId}
    `);
  }

  // Recreate foreign key constraint
  await db.execute(sql`
    ALTER TABLE games ADD CONSTRAINT games_activity_id_activities_id_fk 
    FOREIGN KEY (activity_id) REFERENCES activities(id);
  `);

  console.log('Activity IDs reordered successfully');
  process.exit(0);
}

main().catch(console.error);

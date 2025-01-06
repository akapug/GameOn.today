
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // First drop all constraints
  await db.execute(sql`
    ALTER TABLE games DROP CONSTRAINT IF EXISTS games_activity_id_activities_id_fk;
    ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_name_idx;
    ALTER TABLE activities DROP CONSTRAINT IF EXISTS sports_pkey;
  `);

  // Delete all duplicate activities keeping only the lowest ID for each name
  await db.execute(sql`
    WITH duplicates AS (
      SELECT MIN(id) as keep_id, name
      FROM activities
      GROUP BY name
    )
    DELETE FROM activities a
    WHERE NOT EXISTS (
      SELECT 1 FROM duplicates d
      WHERE d.keep_id = a.id AND d.name = a.name
    );
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

  // Update games to use placeholder IDs first
  for (const mapping of activityMapping) {
    await db.execute(sql`
      UPDATE games 
      SET activity_id = ${mapping.newId + 1000}
      FROM activities
      WHERE games.activity_id = activities.id 
      AND activities.name = ${mapping.name}
    `);
  }

  // Update activities to use new IDs
  for (const mapping of activityMapping) {
    await db.execute(sql`
      UPDATE activities 
      SET id = ${mapping.newId}
      WHERE name = ${mapping.name}
    `);
  }

  // Update games to use final IDs
  for (const mapping of activityMapping) {
    await db.execute(sql`
      UPDATE games 
      SET activity_id = ${mapping.newId}
      WHERE activity_id = ${mapping.newId + 1000}
    `);
  }

  // Recreate constraints
  await db.execute(sql`
    ALTER TABLE activities ADD CONSTRAINT sports_pkey PRIMARY KEY (id);
    ALTER TABLE activities ADD CONSTRAINT activities_name_idx UNIQUE (name);
    ALTER TABLE games ADD CONSTRAINT games_activity_id_activities_id_fk 
      FOREIGN KEY (activity_id) REFERENCES activities(id);
  `);

  console.log('Activity IDs reset complete');
  process.exit(0);
}

main().catch(console.error);

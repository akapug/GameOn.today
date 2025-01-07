import { db } from "../index";
import { sql } from "drizzle-orm";
import { activityConfig } from "../config/activities";

async function reorderActivities(schema: string) {
  console.log(`Reordering activities in ${schema} schema...`);

  // First drop constraints to allow modifications
  await db.execute(sql`
    ALTER TABLE ${sql.identifier(schema)}.games 
    DROP CONSTRAINT IF EXISTS games_activity_id_activities_id_fk;
  `);

  await db.execute(sql`
    ALTER TABLE ${sql.identifier(schema)}.activities 
    DROP CONSTRAINT IF EXISTS activities_pkey;
  `);

  // Remove duplicates keeping only lowest ID entry for each name
  await db.execute(sql`
    WITH duplicates AS (
      SELECT MIN(id) as keep_id, name
      FROM ${sql.identifier(schema)}.activities
      GROUP BY name
    )
    DELETE FROM ${sql.identifier(schema)}.activities a
    WHERE NOT EXISTS (
      SELECT 1 FROM duplicates d
      WHERE d.keep_id = a.id AND d.name = a.name
    );
  `);

  // Update activities using temporary IDs first
  for (const activity of activityConfig) {
    const tempId = activity.id + 1000;

    await db.execute(sql`
      UPDATE ${sql.identifier(schema)}.games 
      SET activity_id = ${tempId}
      FROM ${sql.identifier(schema)}.activities
      WHERE games.activity_id = activities.id 
      AND activities.name = ${activity.name};
    `);

    await db.execute(sql`
      UPDATE ${sql.identifier(schema)}.activities 
      SET id = ${activity.id}
      WHERE name = ${activity.name};
    `);

    await db.execute(sql`
      UPDATE ${sql.identifier(schema)}.games 
      SET activity_id = ${activity.id}
      WHERE activity_id = ${tempId};
    `);
  }

  // Add back constraints
  await db.execute(sql`
    ALTER TABLE ${sql.identifier(schema)}.activities 
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);
  `);

  await db.execute(sql`
    ALTER TABLE ${sql.identifier(schema)}.games 
    ADD CONSTRAINT games_activity_id_activities_id_fk 
    FOREIGN KEY (activity_id) REFERENCES ${sql.identifier(schema)}.activities(id);
  `);
}

async function main() {
  console.log('Starting activity ID reordering...');
  await reorderActivities('development');
  await reorderActivities('production');
  console.log('Activity IDs reordered successfully in both schemas');
  process.exit(0);
}

main().catch(console.error);
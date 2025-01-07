
import { db } from "../index";
import { sql } from "drizzle-orm";

async function reorderActivities(schema: string) {
  // First drop foreign key constraints
  await db.execute(sql`
    ALTER TABLE ${sql.identifier(schema)}.games 
    DROP CONSTRAINT IF EXISTS games_activity_id_activities_id_fk;
  `);

  // Only add constraint if it doesn't exist
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'activities_name_key'
      ) THEN
        ALTER TABLE ${sql.identifier(schema)}.activities 
        ADD CONSTRAINT activities_name_key UNIQUE (name);
      END IF;
    END $$;
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

  for (let i = 0; i < activityOrder.length; i++) {
    const newId = i + 1;
    const { oldId, name } = activityOrder[i];
    
    const tempId = oldId + 1000;
    
    await db.execute(sql`
      UPDATE ${sql.identifier(schema)}.games 
      SET activity_id = ${tempId}
      WHERE activity_id = ${oldId}
    `);
    
    await db.execute(sql`
      UPDATE ${sql.identifier(schema)}.activities 
      SET id = ${newId}
      WHERE id = ${oldId} AND name = ${name}
    `);
    
    await db.execute(sql`
      UPDATE ${sql.identifier(schema)}.games 
      SET activity_id = ${newId}
      WHERE activity_id = ${tempId}
    `);
  }

  // Recreate foreign key constraint
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

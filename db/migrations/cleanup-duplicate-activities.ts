
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // Find duplicates and keep the ones with lowest IDs
  await db.execute(sql`
    WITH duplicates AS (
      SELECT MIN(id) as keep_id, name,
             array_agg(id ORDER BY id) as all_ids
      FROM activities
      GROUP BY name
      HAVING COUNT(*) > 1
    )
    UPDATE games
    SET activity_id = d.keep_id
    FROM duplicates d
    WHERE activity_id = ANY(d.all_ids) AND activity_id != d.keep_id;
  `);

  // Delete duplicate activities
  await db.execute(sql`
    DELETE FROM activities a
    WHERE EXISTS (
      SELECT 1
      FROM activities b
      WHERE b.name = a.name
      AND b.id < a.id
    );
  `);
  
  console.log('Duplicate activities cleaned up');
  process.exit(0);
}

main().catch(console.error);

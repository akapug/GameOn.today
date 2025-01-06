
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // First get the current ID mapping
  const activities = await db.execute(sql`
    SELECT id, name FROM activities ORDER BY id;
  `);
  console.log('Current activities:', activities.rows);

  // Delete duplicates keeping lowest IDs
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

  console.log('Duplicates removed');
  process.exit(0);
}

main().catch(console.error);

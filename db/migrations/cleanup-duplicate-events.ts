
import { db } from "../index";
import { sql } from "drizzle-orm";
import { ensureDevEnvironment } from "../index";

async function main() {
  ensureDevEnvironment();
  
  await db.execute(sql`
    WITH duplicates AS (
      SELECT parent_event_id, MIN(id) as keep_id
      FROM events
      WHERE parent_event_id IS NOT NULL
      GROUP BY parent_event_id
      HAVING COUNT(*) > 1
    )
    DELETE FROM events e
    WHERE EXISTS (
      SELECT 1 FROM duplicates d
      WHERE e.parent_event_id = d.parent_event_id
      AND e.id != d.keep_id
    );
  `);

  console.log('Duplicate recurring events removed');
  process.exit(0);
}

main().catch(console.error);

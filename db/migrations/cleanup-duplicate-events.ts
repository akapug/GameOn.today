
import { db } from "../index";
import { sql } from "drizzle-orm";
import { ensureDevEnvironment } from "../index";

async function main() {
  ensureDevEnvironment();
  
  await db.execute(sql`
    WITH duplicates AS (
      SELECT MIN(id) as keep_id, url_hash
      FROM events
      GROUP BY url_hash
      HAVING COUNT(*) > 1
    )
    DELETE FROM events e
    WHERE EXISTS (
      SELECT 1 FROM duplicates d
      WHERE e.url_hash = d.url_hash
      AND e.id != d.keep_id
    );
  `);

  console.log('Duplicate events removed');
  process.exit(0);
}

main().catch(console.error);

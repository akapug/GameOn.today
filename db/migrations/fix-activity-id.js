
import { db } from "../index.js";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    ALTER TABLE games 
    RENAME COLUMN sport_id TO activity_id;
  `);
  
  console.log('Migration complete');
  process.exit(0);
}

main().catch(console.error);


import { db } from "@db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    ALTER TABLE games 
    ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE
  `);
  
  console.log('Migration complete: Added end_time column');
  process.exit(0);
}

main().catch(console.error);


import { db } from "@db";
import { games } from "@db/schema";
import { sql } from "drizzle-orm";

async function main() {
  // Add any new fields or modifications here
  await db.execute(sql`
    ALTER TABLE games 
    ADD COLUMN IF NOT EXISTS web_link TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT
  `);
  
  console.log('Migration complete');
  process.exit(0);
}

main().catch(console.error);

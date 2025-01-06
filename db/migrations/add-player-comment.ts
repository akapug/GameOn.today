
import { db } from "@db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    ALTER TABLE players 
    ADD COLUMN IF NOT EXISTS comment TEXT
  `);
  
  console.log('Migration complete: Added comment column to players table');
  process.exit(0);
}

main().catch(console.error);

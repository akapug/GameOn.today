
import { db } from "../../db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    ALTER TABLE games 
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT,
    ADD COLUMN IF NOT EXISTS parent_game_id INTEGER REFERENCES games(id)
  `);
  
  console.log('Migration complete: Added recurring game fields');
  process.exit(0);
}

main().catch(console.error);

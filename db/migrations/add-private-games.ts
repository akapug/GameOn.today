
import { db } from "@db";
import { sql } from "drizzle-orm";
import crypto from 'crypto';

async function main() {
  // Add new columns
  await db.execute(sql`
    ALTER TABLE games 
    ADD COLUMN IF NOT EXISTS url_hash TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE
  `);

  // Generate hashes for existing games
  await db.execute(sql`
    UPDATE games 
    SET url_hash = ENCODE(SHA256(CAST(id AS TEXT)::bytea), 'hex')
    WHERE url_hash IS NULL
  `);

  // Make url_hash not nullable after populating existing rows
  await db.execute(sql`
    ALTER TABLE games 
    ALTER COLUMN url_hash SET NOT NULL
  `);
  
  console.log('Migration complete: Added private games fields');
  process.exit(0);
}

main().catch(console.error);

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

  // Generate 12-character random hashes for existing games
  await db.execute(sql`
    UPDATE games 
    SET url_hash = encode(digest(gen_random_uuid()::text, 'sha256'), 'hex')
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
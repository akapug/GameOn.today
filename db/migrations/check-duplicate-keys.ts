
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // Check for duplicate IDs in activities table
  const duplicateActivityIds = await db.execute(sql`
    SELECT id, COUNT(*) 
    FROM activities 
    GROUP BY id 
    HAVING COUNT(*) > 1
  `);

  // Check for duplicate names in activities
  const duplicateActivityNames = await db.execute(sql`
    SELECT name, COUNT(*) 
    FROM activities 
    GROUP BY name 
    HAVING COUNT(*) > 1
  `);

  // Check for duplicate IDs in games table
  const duplicateGameIds = await db.execute(sql`
    SELECT id, COUNT(*) 
    FROM games 
    GROUP BY id 
    HAVING COUNT(*) > 1
  `);

  // Check for duplicate URL hashes
  const duplicateUrlHashes = await db.execute(sql`
    SELECT url_hash, COUNT(*) 
    FROM games 
    GROUP BY url_hash 
    HAVING COUNT(*) > 1
  `);

  console.log('Duplicate Activity IDs:', duplicateActivityIds.rows);
  console.log('Duplicate Activity Names:', duplicateActivityNames.rows);
  console.log('Duplicate Game IDs:', duplicateGameIds.rows);
  console.log('Duplicate URL Hashes:', duplicateUrlHashes.rows);

  process.exit(0);
}

main().catch(console.error);

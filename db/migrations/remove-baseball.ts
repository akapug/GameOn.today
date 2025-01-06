
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    DELETE FROM activities 
    WHERE id = 5 AND name = 'Baseball'
  `);
  
  console.log('Baseball activity removed');
  process.exit(0);
}

main().catch(console.error);

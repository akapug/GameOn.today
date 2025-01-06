
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`SELECT id, name FROM activities ORDER BY id;`);
  console.log('Existing activities:', result.rows);
  process.exit(0);
}

main().catch(console.error);


import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // Update any games with invalid activity_id=7 to use activity_id=1
  await db.execute(sql`UPDATE games SET activity_id = 1 WHERE activity_id = 7`);
  console.log('Game activities updated successfully');
  process.exit(0);
}

main().catch(console.error);

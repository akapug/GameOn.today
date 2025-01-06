
import { db } from "../index";
import { sql } from "drizzle-orm";

async function updateGameActivity() {
  await db.execute(sql`UPDATE games SET activity_id = 9 WHERE id = 60`);
  console.log("Game activity updated successfully");
  process.exit(0);
}

updateGameActivity().catch(console.error);

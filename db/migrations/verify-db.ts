
import { db } from "../index";
import { games } from "../schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Verifying database connection...");
  
  try {
    const result = await db.select().from(games);
    console.log("Games in database:", result);
    
    const tableInfo = await db.execute(sql`SELECT * FROM sqlite_master WHERE type='table'`);
    console.log("Database tables:", tableInfo);
  } catch (error) {
    console.error("Database error:", error);
  }
  
  process.exit(0);
}

main().catch(console.error);

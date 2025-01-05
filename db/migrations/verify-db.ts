
import { db } from "../index";
import { games } from "../schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Verifying database connection...");
  
  try {
    const result = await db.select().from(games);
    console.log("Games in database:", result);
    
    const tableInfo = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Database tables:", tableInfo.rows);
  } catch (error) {
    console.error("Database error:", error);
  }
  
  process.exit(0);
}

main().catch(console.error);

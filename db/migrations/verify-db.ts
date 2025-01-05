
import { db } from "../index";
import { games } from "../schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Attempting database connection...");
  
  try {
    console.log("Verifying database connection...");
    
    // Check database connection
    const dbCheck = await db.execute(sql`SELECT current_database(), current_user;`);
    console.log("Database info:", dbCheck.rows[0]);
    
    // Check if games table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'games'
      );
    `);
    console.log("Games table exists:", tableCheck.rows[0].exists);
    
    // Get games count
    const gamesCount = await db.execute(sql`SELECT COUNT(*) FROM games;`);
    console.log("Number of games:", gamesCount.rows[0].count);
    
  } catch (error) {
    console.error("Database error:", error);
  }
  
  process.exit(0);
}

main().catch(console.error);

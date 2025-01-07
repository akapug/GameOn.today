import { db } from "../index";
import { games, activities } from "../schema";
import { sql } from "drizzle-orm";

async function main() {
  const env = process.env.NODE_ENV || 'development';
  console.log(`Verifying database for ${env} environment...`);

  try {
    // Check database connection and info
    const dbInfo = await db.execute(sql`
      SELECT current_database(), current_user, current_timestamp;
    `);
    console.log("Database info:", dbInfo.rows[0]);

    // Check tables existence
    const tables = ['games', 'activities'];
    for (const table of tables) {
      const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `);
      console.log(`${table} table exists:`, tableCheck.rows[0].exists);
    }

    // Get record counts
    const gamesCount = await db.execute(sql`SELECT COUNT(*) FROM games;`);
    const activitiesCount = await db.execute(sql`SELECT COUNT(*) FROM activities;`);

    console.log("Database Statistics:");
    console.log("- Number of games:", gamesCount.rows[0].count);
    console.log("- Number of activities:", activitiesCount.rows[0].count);

  } catch (error) {
    console.error("Database verification error:", error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Verification script error:", error);
  process.exit(1);
});
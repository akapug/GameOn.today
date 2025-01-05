
import { db } from "@db";
import { games } from "@db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allGames = await db.select().from(games);
  
  for (const game of allGames) {
    if (!game.timezone) {
      await db.update(games)
        .set({ timezone: 'UTC' })
        .where(eq(games.id, game.id));
      console.log(`Updated game ${game.id} timezone to UTC`);
    }
  }
  
  console.log('Migration complete');
  process.exit(0);
}

main().catch(console.error);

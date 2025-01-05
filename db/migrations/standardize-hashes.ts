
import { db } from "@db";
import { games } from "@db/schema";
import { sql } from "drizzle-orm";

function generateHash() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function main() {
  const allGames = await db.select().from(games);
  
  for (const game of allGames) {
    const newHash = generateHash();
    await db.execute(sql`
      UPDATE games 
      SET url_hash = ${newHash}
      WHERE id = ${game.id}
    `);
    console.log(`Updated game ${game.id} hash to ${newHash}`);
  }
  
  console.log('Migration complete: Standardized hash lengths');
  process.exit(0);
}

main().catch(console.error);

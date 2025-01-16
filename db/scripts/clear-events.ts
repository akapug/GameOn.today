
import { db } from "../index";
import { sql } from "drizzle-orm";
import { ensureDevEnvironment } from "../index";

async function main() {
  try {
    ensureDevEnvironment();
    console.log('Clearing all events from development database...');

    await db.execute(sql`
      DELETE FROM development.participants;
      DELETE FROM development.events;
    `);

    console.log('Successfully cleared all events');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing events:', error);
    process.exit(1);
  }
}

main().catch(console.error);

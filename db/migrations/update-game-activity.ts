
const { db } = require("../index");
const { sql } = require("drizzle-orm");

async function main() {
  await db.execute(sql`UPDATE games SET activity_id = 9 WHERE id = 60`);
  console.log('Game activity updated successfully');
  process.exit(0);
}

main().catch(console.error);

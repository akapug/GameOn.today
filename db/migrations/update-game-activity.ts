
import { db } from "../index";
import { sql } from "drizzle-orm";

async function main() {
  // Check if we're in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('This script should only be run in production!');
    process.exit(1);
  }

  console.log('Updating game activities in production...');
  
  // Update games that have Basketball (id=2) to use Frisbee (id=1)
  await db.execute(sql`UPDATE games SET activity_id = 1 WHERE activity_id = 2`);
  
  console.log('Game activities updated successfully');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error updating game activities:', error);
  process.exit(1);
});

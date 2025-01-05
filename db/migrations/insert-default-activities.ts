
import { db } from "../index";
import { activities } from "../schema";
import { defaultActivities } from "../../client/src/lib/activities";

async function main() {
  for (const activity of defaultActivities) {
    await db.insert(activities).values(activity).onConflictDoNothing();
  }
  
  console.log('Default activities inserted');
  process.exit(0);
}

main().catch(console.error);


import { sql } from "drizzle-orm";

export async function up(db: any) {
  await sql`
    ALTER TABLE sports RENAME TO activities;
    ALTER TABLE games RENAME COLUMN sport_id TO activity_id;
  `.execute(db);
}

export async function down(db: any) {
  await sql`
    ALTER TABLE activities RENAME TO sports;
    ALTER TABLE games RENAME COLUMN activity_id TO sport_id;
  `.execute(db);
}


import { db } from "@db";
import { changelog } from "@db/schema";

export async function getChangelog() {
  try {
    return await db.query.changelog.findMany({
      orderBy: (changelog, { desc }) => [desc(changelog.date)],
      limit: 50
    });
  } catch (error) {
    console.error("Database error in getChangelog:", error);
    throw error;
  }
}

export async function addChangelogEntry(entry: {
  deploymentId: string;
  message: string;
  version?: string;
}) {
  return await db.insert(changelog).values({
    ...entry,
    date: new Date().toISOString()
  });
}

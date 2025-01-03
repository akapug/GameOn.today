
import { db } from "@db";
import { changelog } from "@db/schema";

export async function getChangelog() {
  return await db.query.changelog.findMany({
    orderBy: (changelog, { desc }) => [desc(changelog.date)],
    limit: 50
  });
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

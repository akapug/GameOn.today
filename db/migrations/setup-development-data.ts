import { db } from "@db";
import { activities, games } from "@db/schema";
import { sql } from "drizzle-orm";

const sampleGames = [
  {
    title: "Weekly Basketball Pickup Game",
    activityId: 1,
    location: "Downtown Recreation Center",
    date: new Date("2025-01-14T18:00:00Z"),
    endTime: new Date("2025-01-14T20:00:00Z"),
    playerThreshold: 6,
    isRecurring: true,
    recurrenceFrequency: "weekly",
    webLink: "https://meetup.com/sample-basketball",
    notes: "Bring both light and dark shirts for team selection",
    urlHash: "basketball-weekly",
    isPrivate: false,
    creatorId: "sample-creator-1",
    creatorName: "John Doe",
    timezone: "America/Los_Angeles"
  },
  {
    title: "Tennis Doubles Tournament",
    activityId: 3,
    location: "City Tennis Club",
    date: new Date("2025-01-20T14:00:00Z"),
    endTime: new Date("2025-01-20T18:00:00Z"),
    playerThreshold: 12,
    isRecurring: false,
    webLink: "https://citytennisclub.com/tournament",
    notes: "Tournament brackets will be posted 1 hour before start",
    urlHash: "tennis-tourney",
    isPrivate: false,
    creatorId: "sample-creator-2",
    creatorName: "Jane Smith",
    timezone: "America/New_York"
  }
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('This script should not be run in production!');
    process.exit(1);
  }

  console.log('Setting up development sample data...');

  try {
    // First verify we have the default activities
    const activitiesCount = await db.execute(sql`SELECT COUNT(*) FROM activities;`);

    if (parseInt(activitiesCount.rows[0].count) < 10) {
      console.log('Running default activities migration first...');
      await import('./insert-default-activities.ts');
    }

    // Insert sample games
    for (const game of sampleGames) {
      await db.execute(sql`
        INSERT INTO games (
          title, activity_id, location, date, end_time,
          player_threshold, is_recurring, recurrence_frequency,
          web_link, notes, url_hash, is_private,
          creator_id, creator_name, timezone
        ) VALUES (
          ${game.title}, ${game.activityId}, ${game.location},
          ${game.date}, ${game.endTime}, ${game.playerThreshold},
          ${game.isRecurring}, ${game.recurrenceFrequency || null},
          ${game.webLink || null}, ${game.notes || null},
          ${game.urlHash}, ${game.isPrivate},
          ${game.creatorId}, ${game.creatorName}, ${game.timezone}
        )
        ON CONFLICT (url_hash) DO NOTHING;
      `);
    }

    console.log('Sample games data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up development data:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Setup script error:', error);
  process.exit(1);
});
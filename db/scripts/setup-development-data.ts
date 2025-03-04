
import { db } from "../index";
import { sql } from "drizzle-orm";

const sampleEvents = [
  {
    title: "Weekly Basketball Pickup Game",
    eventTypeId: 2,
    location: "Downtown Recreation Center",
    date: new Date("2025-01-14T18:00:00Z"),
    endTime: new Date("2025-01-14T20:00:00Z"),
    participantThreshold: 6,
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
    eventTypeId: 3,
    location: "City Tennis Club",
    date: new Date("2025-01-20T14:00:00Z"),
    endTime: new Date("2025-01-20T18:00:00Z"),
    participantThreshold: 12,
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
    // Clear existing events
    await db.execute(sql`TRUNCATE TABLE events CASCADE`);
    console.log('Cleared existing events');

    // First verify we have the default event types
    const eventTypesCount = await db.execute(sql`SELECT COUNT(*) FROM event_types;`);

    if (parseInt(eventTypesCount.rows[0].count) < 10) {
      console.log('Running default event types migration first...');
      await import('../migrations/insert-default-activities.ts');
    }

    // Insert sample events
    for (const event of sampleEvents) {
      await db.execute(sql`
        INSERT INTO events (
          title, event_type_id, location, date, end_time,
          participant_threshold, is_recurring, recurrence_frequency,
          web_link, notes, url_hash, is_private,
          creator_id, creator_name, timezone
        ) VALUES (
          ${event.title}, ${event.eventTypeId}, ${event.location},
          ${event.date}, ${event.endTime}, ${event.participantThreshold},
          ${event.isRecurring}, ${event.recurrenceFrequency || null},
          ${event.webLink || null}, ${event.notes || null},
          ${event.urlHash}, ${event.isPrivate},
          ${event.creatorId}, ${event.creatorName}, ${event.timezone}
        )
        ON CONFLICT (url_hash) DO NOTHING;
      `);
    }

    console.log('Sample events data inserted successfully');
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

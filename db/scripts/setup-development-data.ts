
import { db } from "../index";
import { events } from "../schema";
import { sql } from "drizzle-orm";
import { ensureDevEnvironment } from "../index";

const sampleEvents = [
  {
    title: "Weekly Basketball Pickup Game",
    eventTypeId: 1,
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
  try {
    ensureDevEnvironment();
    console.log('Setting up development sample data...');

    // Insert sample events
    for (const event of sampleEvents) {
      await db.insert(events).values(event).onConflictDoNothing();
    }

    console.log('Sample data setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up development data:', error);
    process.exit(1);
  }
}

main().catch(console.error);

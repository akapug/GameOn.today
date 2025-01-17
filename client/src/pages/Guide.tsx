
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Guide() {
  return (
    <div className="container py-6 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <a className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </a>
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Getting Started Guide</h1>
        <div className="prose prose-slate dark:prose-invert">
          <h2>Why Create an Account?</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>Track your created and joined events</li>
            <li>Receive email notifications about event updates</li>
            <li>Create private events for specific groups</li>
            <li>Edit your event details after creation</li>
            <li>Set recurring events for regular activities</li>
          </ul>

          <h2>Creating an Event</h2>
          <ol className="list-decimal pl-6 mb-6">
            <li>Click the "New Event" button on the home page</li>
            <li>Select your activity type</li>
            <li>Fill in the event details (date, time, location)</li>
            <li>Set your participant threshold</li>
            <li>Choose public or private visibility</li>
            <li>Click "Create Event" to publish</li>
          </ol>

          <h2>Joining Events</h2>
          <ol className="list-decimal pl-6 mb-6">
            <li>Browse available events on the home page</li>
            <li>Click "Join" on an event you're interested in</li>
            <li>Indicate your likelihood of attending</li>
            <li>Add an optional comment</li>
            <li>Submit your response</li>
          </ol>

          <h2>Managing Your Events</h2>
          <ul className="list-disc pl-6 mb-6">
            <li>View your created and joined events in your profile</li>
            <li>Edit event details as the creator</li>
            <li>Update your attendance status anytime</li>
            <li>Receive email notifications for updates</li>
            <li>Cancel or reschedule events as needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

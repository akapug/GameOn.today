
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Guide() {
  return (
    <div className="container py-6 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">How To Use</h1>
        <div className="prose prose-slate dark:prose-invert">
          <h2 className="text-xl font-bold mt-6 mb-3">Logging In</h2>
          <ul className="space-y-2 mb-4">
            <li>Click "Sign in with Google" in the top right corner</li>
            <li>Login is required to create and join events</li>
            <li>Your profile picture and name will be visible to other users</li>
            <li>You can manage your events and responses from the user menu</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">Creating Events</h2>
          <ul className="space-y-2 mb-4">
            <li>Click "Create Event" on the home page</li>
            <li>Select an activity type and fill in event details</li>
            <li>Set the date, time, and location</li>
            <li>Choose whether it's a recurring event</li>
            <li>Set minimum/maximum participants if needed</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">Joining Events</h2>
          <ul className="space-y-2 mb-4">
            <li>Browse available events on the home page</li>
            <li>Click on an event to view details</li>
            <li>Select "Join" to participate</li>
            <li>Choose "Maybe" if you're not sure</li>
            <li>Add an optional comment when joining</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">Managing Your Events</h2>
          <ul className="space-y-2 mb-4">
            <li>View your events in the user menu</li>
            <li>Edit responses or leave events</li>
            <li>Create private events for specific groups</li>
            <li>Set up recurring events for regular activities</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">Additional Features</h2>
          <ul className="space-y-2">
            <li>Check weather forecasts for outdoor activities</li>
            <li>Receive email notifications for event updates</li>
            <li>View event history and past attendance</li>
            <li>Filter events by activity type or date</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

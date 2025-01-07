import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function About() {
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
        <h1 className="text-3xl font-bold mb-6">About Our Platform</h1>
        <div className="prose prose-slate dark:prose-invert">
          <p className="text-lg mb-4">
            Our platform is a flexible coordination system for organizing sports and recreational activities. Whether you're arranging pickup events, social sports, or regular meetups, we simplify the coordination process so you can focus on participating.
          </p>
          <ul className="space-y-2 mb-6">
            <li>Create and join events for any sport or activity</li>
            <li>Set participant thresholds to ensure enough attendees</li>
            <li>Track attendance with definite and tentative responses</li>
            <li>Check weather forecasts for outdoor activities</li>
            <li>Get email notifications for event updates</li>
            <li>Create recurring events for regular meetups</li>
            <li>Manage private events with controlled access</li>
            <li>Edit or cancel your responses easily</li>
            <li>View archived event history</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">Coming Soon</h2>
          <ul className="space-y-2 mb-6">
            <li>SMS and other notification options beyond email</li>
            <li>Polls for deciding optimal event dates and times</li>
            <li>Anything you request! <a href="mailto:contact@example.com" className="underline hover:text-foreground">Email us</a> with your ideas</li>
          </ul>

          <p>
            Whether you're organizing ultimate frisbee, basketball, soccer, or any other activity, our platform helps you spend less time coordinating and more time participating.
          </p>
        </div>
      </div>
    </div>
  );
}
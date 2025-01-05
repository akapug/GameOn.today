
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
        <h1 className="text-3xl font-bold mb-6">About GameOn</h1>
        <div className="prose prose-slate dark:prose-invert">
          <p className="text-lg mb-4">
            GameOn is a flexible platform for organizing sports and recreational activities. Whether you're arranging pickup games, social sports, or regular meetups, GameOn simplifies the coordination process so you can focus on playing.
          </p>
          <ul className="space-y-2 mb-6">
            <li>Create and join games for any sport or activity</li>
            <li>Set player thresholds to ensure enough participants</li>
            <li>Track attendance with definite and tentative responses</li>
            <li>Check weather forecasts for outdoor activities</li>
            <li>Get email notifications for game updates</li>
            <li>Create recurring games for regular meetups</li>
            <li>Manage private games with controlled access</li>
            <li>Edit or cancel your responses easily</li>
            <li>View archived game history</li>
          </ul>
          
          <h2 className="text-xl font-bold mt-8 mb-4">Coming Soon</h2>
          <ul className="space-y-2 mb-6">
            <li>SMS and other notification options beyond email</li>
            <li>Polls for deciding optimal game dates and times</li>
            <li>Anything you request! <a href="mailto:pug@calulti.org" className="underline hover:text-foreground">Email us</a> with your ideas</li>
          </ul>
          
          <p>
            Whether you're organizing ultimate frisbee, basketball, soccer, or any other activity, GameOn helps you spend less time coordinating and more time playing.
          </p>
        </div>
      </div>
    </div>
  );
}

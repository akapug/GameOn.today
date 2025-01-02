
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
            GameOn is a platform designed primarily for organizing ultimate frisbee games and events, though it works great for other sports too. Whether you're organizing pickup, league games, or scrimmages, GameOn streamlines the process.
          </p>
          <ul className="space-y-2 mb-6">
            <li>Create and join local ultimate games (or any other sport)</li>
            <li>Set player thresholds to ensure enough players for teams</li>
            <li>Check weather forecasts for field conditions</li>
            <li>Track who's playing and manage attendance</li>
            <li>Get email notifications about game updates</li>
          </ul>
          
          <h2 className="text-xl font-bold mt-8 mb-4">Coming Soon</h2>
          <ul className="space-y-2 mb-6">
            <li>SMS and other notification options beyond email</li>
            <li>Polls for deciding optimal game dates and times</li>
            <li>Anything you request! <a href="mailto:pug@calulti.org" className="underline hover:text-foreground">Email us</a> with your ideas</li>
          </ul>
          
          <p>
            Whether you're organizing pickup ultimate, a soccer match, or any other sport, GameOn helps you spend less time organizing and more time playing.
          </p>
        </div>
      </div>
    </div>
  );
}

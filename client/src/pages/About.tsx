
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
            GameOn is a platform that makes organizing pickup games and sports activities easier than ever. Here's what you can do:
          </p>
          <ul className="space-y-2 mb-6">
            <li>Create and join local sports games</li>
            <li>Set player thresholds to ensure enough participants</li>
            <li>Check weather forecasts for outdoor activities</li>
            <li>Track who's playing and manage attendance</li>
            <li>Get notifications about game updates</li>
          </ul>
          <p>
            Whether you're organizing a pickup basketball game, soccer match, or any other sport, GameOn helps you spend less time organizing and more time playing.
          </p>
        </div>
      </div>
    </div>
  );
}

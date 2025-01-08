
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Changelog() {
  return (
    <div className="container py-6 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Changelog</h1>
        <div className="prose prose-slate dark:prose-invert">
          <ul className="space-y-4">
            <li>
              <strong>January 7, 2024</strong> - Bugfixes and mobile responsiveness optimizations
            </li>
            <li>
              <strong>January 6, 2024</strong> - Added attendee comments, improved test coverage, and enhanced development/production environment separation
            </li>
            <li>
              <strong>January 5, 2024</strong> - Bugfixes, private game creation and handling
            </li>
            <li>
              <strong>January 4, 2024</strong> - Added game details and recurring games
            </li>
            <li>
              <strong>January 2, 2024</strong> - Add response editing and cancellation
            </li>
            <li>
              <strong>January 1, 2024</strong> - First deployed version
            </li>
            <li>
              <strong>December 30, 2023</strong> - First dev version
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

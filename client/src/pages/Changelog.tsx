
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import type { ChangelogEntry } from "../lib/types";

export default function Changelog() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  
  useEffect(() => {
    fetch('/api/changelog')
      .then(res => res.json())
      .then(data => setEntries(data));
  }, []);

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
        <h1 className="text-3xl font-bold mb-6">Changelog</h1>
        <div className="space-y-8">
          {entries.map((entry) => (
            <div key={entry.deploymentId} className="border-b pb-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{entry.message}</h3>
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Deployment: {entry.deploymentId}
                {entry.version && ` • Version ${entry.version}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

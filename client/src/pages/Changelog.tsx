
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Changelog() {
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
          <div className="border-b pb-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">Add response editing and cancellation</h3>
              <span className="text-sm text-muted-foreground">1.2.24</span>
            </div>
          </div>
          <div className="border-b pb-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">First deployed version</h3>
              <span className="text-sm text-muted-foreground">1.1.24</span>
            </div>
          </div>
          <div className="border-b pb-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">First dev version</h3>
              <span className="text-sm text-muted-foreground">12.30.24</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import { Link } from "wouter";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-90">
      <img 
        src="/gameonlogo.jpg"
        alt="GameOn"
        className="h-12 w-auto" 
      />
    </Link>
  );
}

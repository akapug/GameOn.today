export default function Footer() {
  return (
    <footer className="py-6 border-t">
      <div className="container text-center text-sm text-muted-foreground">
        Created by{" "}
        <a
          href="https://davidryalanderson.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          pug
        </a>{" "}
        and sponsored by{" "}
        <a
          href="https://calulti.org/donate"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          CalUlti
        </a>
      </div>
    </footer>
  );
}

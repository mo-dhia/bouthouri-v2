import Link from "next/link";
import "./globals.css";

export default function GlobalNotFound() {
  return (
    <html lang="en"><body>
      <main className="not-found"><p>404</p><h1>Page not found.</h1><Link href="/en">Home</Link></main>
    </body></html>
  );
}

import Link from "next/link";

export default function NotFound() { return <main className="error-page section-wrap"><span className="mono">404 / NOTHING FILED HERE</span><h1>A loose page.</h1><p>This page hasn’t found its way into the archive.</p><Link href="/" className="text-link">Return home ↗</Link></main>; }

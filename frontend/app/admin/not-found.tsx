import Link from "next/link";

export default function AdminNotFound() {
  return <section className="admin-panel"><h1>This CMS page is unavailable.</h1><p>The link may be outdated. Return to your projects to continue editing.</p><Link href="/admin" className="admin-button">Return to projects</Link></section>;
}

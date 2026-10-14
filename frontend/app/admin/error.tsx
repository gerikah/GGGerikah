"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-panel"><p className="admin-eyebrow">CONNECTION INTERRUPTED</p><h2>Your notes could not be loaded.</h2><p>Check your connection, then try again. If this continues, confirm that Supabase and the database migration are configured.</p><button type="button" className="admin-button" onClick={reset}>Try again</button></div>;
}
